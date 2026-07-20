# Carbon Canvas — Engineering Blueprint

**Author:** Founding CTO & Lead Engineer
**Inputs:** Master Product Document; Product Strategy Review; Technical Feasibility Assessment; MVP Development Plan; PRD; UX Strategy (all in repo)
**Status:** Implementation-ready blueprint. Build begins only after this is agreed.
**Scope:** The MVP as defined in the PRD (Chrome; ChatGPT + Claude; metadata-only; energy-first). Post-MVP items are noted but not architected in detail.

> **Engineering thesis (repeated because it governs every decision):** The data source is an unofficial, brittle scrape of third-party apps we don't control. Construction is cheap; *keeping it working* and *making estimates credible* is the real work. Therefore: isolate fragility behind adapters, drive them by remote config, plumb confidence everywhere, make privacy structurally impossible to violate, and buy every commodity component so the team spends its scarce time only on the differentiated core.

---

## 1. Technical architecture

### 1.1 System overview
```
┌───────────────────────────── USER'S BROWSER ─────────────────────────────┐
│  Chrome Extension (Manifest V3, TypeScript)                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Content Scripts  ── PlatformAdapter interface ──                 │    │
│  │   • chatgpt.adapter   • claude.adapter                          │    │
│  │   detect · observe turns · read text IN-PAGE → counts → DISCARD │    │
│  └───────────────┬─────────────────────────────────────────────────┘    │
│  ┌───────────────▼──────────────┐   ┌──────────────────────────────┐    │
│  │ Background Service Worker     │   │ Popup (React)                │    │
│  │  • persist-immediately (MV3)  │   │  • today glance · controls   │    │
│  │  • batch · sync · health      │   └──────────────────────────────┘    │
│  └───────┬───────────────▲───────┘                                       │
│  chrome.storage.local     │ remote CONFIG (selectors, flags, kill switch)│
└──────────┼────────────────┼──────────────────────────────────────────────┘
           │ HTTPS (metadata-only allowlist payload)      ▲
           ▼                                              │
┌────────────────────────── BACKEND (Next.js on Vercel) ──┼─────────────────┐
│  API layer (route handlers)                             │                 │
│   /ingest  /sessions  /analytics  /methodology  /account │  /config (CDN)  │
│  ┌────────────┐ ┌──────────────────┐ ┌─────────────────┐                  │
│  │ Auth (Clerk│ │ Estimation Engine │ │ Analytics/Rollup│                  │
│  │  or Supa)  │ │ (versioned, pure) │ │  (SQL)          │                  │
│  └────────────┘ └────────┬─────────┘ └────────┬────────┘                  │
│           ┌──────────────▼──────────────────────▼───────┐                 │
│           │      PostgreSQL (Supabase) + Prisma + RLS    │                 │
│           │      Research DB (sources, methodology vers) │                 │
│           └──────────────────────────────────────────────┘                │
└───────────────────────────────────────────────────────────────────────────┘
                              ▲
                              │
        Next.js Dashboard (React, shadcn/ui, Recharts) — reads via API
```

### 1.2 Components — what, why, how they talk

| Component | What it does | Why it exists | Communicates via |
|---|---|---|---|
| **Content scripts (adapters)** | Detect platform, observe turns, read visible text *in-page* to compute counts, then discard it | The only place AI usage is observable; isolates per-platform fragility | DOM (read) → messages to service worker |
| **Service worker** | Buffers, persists to `chrome.storage`, batches, syncs, reports health, applies remote config | MV3 has no persistent background; centralizes state/sync/security | `chrome.runtime` messaging; HTTPS to API; fetch remote config |
| **Popup** | Today's glance + privacy controls + dashboard link | Reassurance & control entry point (UX §2) | Reads local store; opens dashboard |
| **Remote config service** | Serves selectors, feature flags, per-adapter kill switch | Fix breakage without a store release; disable broken adapters | CDN/JSON fetched by worker |
| **API layer** | Auth'd ingest, reads for dashboard, methodology, account ops | Front door; validation, rate-limit, idempotency | HTTPS/REST; calls engine + DB |
| **Auth** | Identity, sessions, MFA support | Never build auth | Managed SDK (Clerk/Supabase) |
| **Estimation engine** | Pure, versioned usage→energy(→carbon) pipeline with ranges + confidence | The credibility core; server-side so methodology updates need no extension release | Called by API; reads Research DB |
| **Analytics/rollup** | Daily/weekly/monthly aggregates | Cheap dashboard reads at MVP scale | SQL over Postgres |
| **PostgreSQL** | Metadata, estimates (with inputs), research, methodology versions | Single source of truth; RLS isolation; no content columns | Prisma from API/engine |
| **Research DB** | Sources, assumptions, methodology versions | Scientific spine; makes estimates auditable/recomputable | Tables in same Postgres |
| **Dashboard** | Overview, Usage, Impact, Methodology, Settings | Where value is delivered (UX §4) | Reads API; auth session |

### 1.3 Data flow (one session, end to end)
1. User opens `claude.ai` → content script `claude.adapter` attaches.
2. Adapter observes turns; reads visible text **in memory only** to estimate token count; **discards text**.
3. Adapter posts metadata events to the worker; worker writes to `chrome.storage` immediately (MV3 may kill it).
4. Worker batches and POSTs a **metadata-only allowlist payload** to `/ingest` (skipped entirely in local-only mode).
5. API validates, dedupes (idempotency key), writes `ai_sessions` + `usage_events`.
6. Estimation engine computes energy range + confidence from stored inputs, writes `environmental_estimates` with `methodology_version`.
7. Dashboard reads rollups + estimates; renders with confidence + "how calculated."
8. Worker periodically fetches remote config; if `claude.adapter` is kill-switched, it stops emitting and the UI shows the honest "paused" state (UX §9).

---

## 2. Technology decisions

Format: **choice · why · alternatives · tradeoff.** These ratify the Master Doc/PRD stack with engineering rationale.

### Frontend (dashboard)
- **Framework — Next.js (App Router) + TypeScript.** *Why:* one framework for UI + API routes (small team, one deploy target), SSR for the marketing/landing, great Vercel DX. *Alternatives:* Vite SPA + separate API (more moving parts); Remix (smaller ecosystem). *Tradeoff:* some App-Router complexity, accepted for the monorepo simplicity.
- **UI — shadcn/ui + Radix.** *Why:* accessible primitives (PRD NFR-8), own-the-code components we restyle to the Carbon Canvas soul (UX §10). *Alternatives:* MUI (heavy, opinionated look), Chakra (runtime cost). *Tradeoff:* more styling work than a batteries-included kit, but avoids "default-kit" look.
- **Styling — Tailwind.** *Why:* fast, consistent design tokens, tiny runtime. *Alternatives:* CSS Modules (slower iteration), styled-components (runtime cost). *Tradeoff:* verbose class strings, mitigated by components.
- **Charts — Recharts** (+ custom SVG for the "living footprint"). *Why:* declarative, good-enough, fast to ship. *Alternatives:* Visx/D3 (power, but slow to build), Chart.js (canvas, less Reactful). *Tradeoff:* Recharts is limiting for the signature organic viz — that piece may become custom SVG later.
- **Motion — Framer Motion**, used with restraint (UX §10.5). Respect `prefers-reduced-motion`.

### Extension
- **Manifest V3 + TypeScript.** *Why:* the only supported Chrome standard; TS is essential across fragile scraping code. *Alternatives:* none viable (MV2 deprecated). *Tradeoff:* MV3's ephemeral worker + no-remote-code constraints shape the whole design (§3).
- **Build — Vite + CRXJS** (or WXT). *Why:* fast HMR for extension dev, TS-first. *Alternatives:* raw webpack (slower DX), Plasmo (opinionated, heavier). *Tradeoff:* young tooling; acceptable.
- **UI in popup — React** (shared components with dashboard where sensible). *Tradeoff:* bundle size — keep popup lean.
- **Browser compatibility:** Chrome first. Firefox/Edge are largely portable (WebExtension APIs) — later. Safari is a separate, expensive effort — deferred (Feasibility §3).

### Backend
- **Next.js route handlers (monolith at MVP).** *Why:* co-located with frontend, one deploy, enough for low-thousands of users emitting small events. *Alternatives:* standalone Node/Fastify service (premature separation), serverless-only functions (cold-start + orchestration overhead). *Tradeoff:* will need extraction to a dedicated service at scale — a good problem to have later.
- **API architecture — REST.** *Why:* simple, cache-friendly, trivial from an extension. *Alternatives:* GraphQL (overkill for a handful of endpoints; adds complexity), tRPC (great for internal, but the extension benefits from plain REST). *Tradeoff:* less flexible querying — fine for fixed dashboard needs. GraphQL/public API is a post-MVP consideration.

### Database
- **PostgreSQL via Supabase, Prisma ORM, RLS on.** *Why:* relational fits the session/estimate/methodology model; Supabase gives managed Postgres + auth + storage cheaply; Prisma gives type-safe queries matching our TS stack; **RLS** enforces per-user isolation at the DB, our last line of defense. *Alternatives:* Mongo (no relational integrity we need; weaker for aggregates), PlanetScale/MySQL (fine, but Supabase's bundled auth/RLS wins for a tiny team), Firebase (lock-in, weaker relational). *Tradeoff:* Prisma + Supabase RLS need care to align; documented pattern.

### Infrastructure
- **Hosting — Vercel (web/API) + Supabase (DB/auth/storage).** *Why:* near-zero ops, generous low tiers, instant deploys, preview environments. *Alternatives:* Render/Fly/AWS (more control, more ops burden a 2-person team can't spare). *Tradeoff:* platform coupling; acceptable and reversible at this stage.
- **Remote config — static JSON on a CDN** (Vercel edge / Supabase storage), signed. *Why:* MV3 forbids remote *code* but allows remote *config*; this is our breakage-fix lever.
- **Deployment — Git-push to Vercel (preview per PR, prod on main).** Extension via CI-built artifact → Chrome Web Store.
- **Monitoring — Sentry (errors, web + extension), Vercel/Supabase metrics, plus a custom adapter-health dashboard** (the most important signal we have — Feasibility §10).

---

## 3. Browser extension architecture

### 3.1 Structure
```
extension/
  manifest.json            # MV3, minimal permissions
  src/
    content/
      index.ts             # bootstrap: pick adapter by hostname
      adapters/
        types.ts           # PlatformAdapter interface
        chatgpt.adapter.ts
        claude.adapter.ts
      dom/observer.ts       # debounced MutationObserver helpers
      privacy/counts.ts     # text → counts, then discard (never returns text)
    background/
      worker.ts             # state, batching, sync, health, config
      sync.ts               # metadata-only POST with retry/idempotency
      config.ts             # fetch + cache remote config
      storage.ts            # chrome.storage wrapper (persist-immediately)
    popup/
      App.tsx               # today glance + controls
    shared/
      schema.ts             # zod schemas for the allowlist payload
      types.ts
```

### 3.2 The adapter interface (isolation of fragility — the key abstraction)
```ts
interface PlatformAdapter {
  platform: 'chatgpt' | 'claude';
  matches(url: URL): boolean;
  // observe the page; emit metadata events; NEVER emit text
  start(ctx: AdapterContext): void;
  stop(): void;
  // pure helpers, driven by remote-config selectors:
  detectModel(cfg: SelectorConfig): string | null;   // may return null (common)
  countTurns(cfg: SelectorConfig): number;
  estimateTokens(cfg: SelectorConfig): { tokens: number; confidence: Confidence };
}
```
Selectors are injected from **remote config**, not hardcoded — so a break is fixed by pushing JSON, not shipping a release.

### 3.3 Permissions (minimal — every permission is a conversion cost, UX §1.5)
```jsonc
{
  "manifest_version": 3,
  "permissions": ["storage"],
  "host_permissions": ["https://chatgpt.com/*", "https://chat.openai.com/*", "https://claude.ai/*"],
  "background": { "service_worker": "background/worker.js" },
  "content_scripts": [{ "matches": [...same hosts...], "js": ["content/index.js"], "run_at": "document_idle" }]
}
```
No `tabs`, no `<all_urls>`, no `webRequest`. The narrower the host list, the calmer Chrome's warning.

### 3.4 Content scripts, background, data collection
- **Content scripts:** attach per host; use a **debounced MutationObserver** to detect new turns and session boundaries; call `privacy/counts.ts` which takes text and returns *only numbers*. Text never leaves the function scope.
- **Background worker:** treat as ephemeral — `storage.ts` persists on every state change (PRD NFR-2). Batches events, syncs on interval/threshold, fetches config, reports health.
- **Data collection method:** DOM observation only. No network interception, no reading provider APIs, no cookies.

### 3.5 Privacy protections (structural, not promised)
- `estimateTokens`/`countTurns` **cannot return text** (type system + `counts.ts` never exposes it).
- Sync payload validated against a **zod allowlist** (`shared/schema.ts`); any stray field is rejected client- and server-side.
- **CI content-leak guard** (PRD TR-5) fails the build if text can reach storage/network.
- Local-only mode: worker's `sync.ts` is a no-op; everything stays in `chrome.storage`.

### 3.6 Platform limitations — what is realistically possible

| Platform | Reliably gettable | Hard/unreliable | Notes |
|---|---|---|---|
| **ChatGPT** (chatgpt.com) | platform, session, duration, turn count | model (often "Auto"/hidden), tokens | Heavy A/B tests, message virtualization on long chats; biggest usage so highest priority. **MVP.** |
| **Claude** (claude.ai) | platform, session, duration, turns, **model usually visible** | tokens (estimate only) | Relatively cleaner DOM → best second adapter. **MVP.** |
| **Gemini** (gemini.google.com) | platform, session | model, tokens; markup obfuscated & churny | Also lives in Workspace (invisible to us). **Post-MVP.** |
| **Perplexity** | platform, session | "prompt/model" map poorly to our schema | Search+sources model differs. **Post-MVP.** |

**Universal hard limits (all platforms):** no official consumer usage API; tokens are always an *estimate of visible text* and miss reasoning/system/tool tokens (can be wrong by multiples); model frequently unknown; native/mobile/voice usage is completely invisible; scraping may breach ToS and can be blocked at any time. **Design consequence:** "unknown model / low confidence" is a *normal, first-class state*, never an error (UX §7, §9).

---

## 4. Database architecture

Postgres + Prisma. **No table can store conversation content — enforced by schema.** All user tables carry RLS. Presented as Prisma-style models (illustrative).

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique          // null in local-only-migrated accounts
  createdAt     DateTime @default(now())
  settings      Settings?
  platforms     ConnectedPlatform[]
  sessions      AiSession[]
}

model Settings {
  id             String  @id @default(cuid())
  userId         String  @unique
  trackingPaused Boolean @default(false)
  perPlatform    Json    // { chatgpt: true, claude: true }
  localOnly      Boolean @default(false)
  retentionDays  Int?    // null = keep until user deletes
  user           User    @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model AiPlatform {                          // reference table (seeded)
  id          String @id                    // 'chatgpt' | 'claude' | ...
  displayName String
  hostnames   String[]
  models      AiModel[]
}

model AiModel {                             // reference table (seeded, versioned)
  id           String @id                   // 'claude-sonnet', 'gpt-generic', ...
  platformId   String
  displayName  String
  modelClass   String                       // 'small' | 'large' | 'reasoning' | 'multimodal' | 'unknown'
  // estimation inputs (assumptions, all cited in ResearchSource):
  energyPerTokenWh   Float?                  // nullable → drives low confidence
  assumptionsSourceId String?
  platform     AiPlatform @relation(fields: [platformId], references: [id])
}

model ConnectedPlatform {
  id          String @id @default(cuid())
  userId      String
  platformId  String
  status      String  @default("active")
  connectedAt DateTime @default(now())
  user        User @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, platformId])
}

model AiSession {
  id            String   @id @default(cuid())
  userId        String
  platformId    String
  modelId       String?                      // NULLABLE — unknown is normal
  startedAt     DateTime
  endedAt       DateTime?
  durationSec   Int?
  turnCount     Int      @default(0)
  estTokens     Int?                         // NULLABLE — estimate only
  tokenConfidence String @default("low")     // 'high'|'medium'|'low'
  clientEventId String   @unique             // idempotency
  createdAt     DateTime @default(now())
  user          User @relation(fields: [userId], references: [id], onDelete: Cascade)
  events        UsageEvent[]
  estimate      EnvironmentalEstimate?
  @@index([userId, startedAt])
  // NOTE: no prompt/response/content columns anywhere. By design.
}

model UsageEvent {
  id          String   @id @default(cuid())
  sessionId   String
  type        String                          // 'turn' | 'session_start' | 'session_end'
  at          DateTime
  estTokens   Int?
  session     AiSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  @@index([sessionId])
}

model EnvironmentalEstimate {
  id                 String @id @default(cuid())
  sessionId          String @unique
  energyWhLow        Float
  energyWhHigh       Float
  energyConfidence   String                   // 'high'|'medium'|'low'
  carbonGLow         Float?                    // post-MVP (nullable now)
  carbonGHigh        Float?
  waterLLow          Float?                    // later
  waterLHigh         Float?
  methodologyVersion String
  inputsJson         Json                      // EXACT inputs → recomputable (NFR-12)
  confidenceReasons  Json                      // [{ok:true,label:'model known'}, ...]
  createdAt          DateTime @default(now())
  session            AiSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
}

model MethodologyVersion {
  version     String  @id                     // 'e-1.0.0'
  summary     String
  assumptions Json
  releasedAt  DateTime @default(now())
  sourceIds   String[]                         // → ResearchSource
}

model ResearchSource {
  id          String @id @default(cuid())
  title       String
  author      String?
  org         String?
  url         String?
  pubDate     DateTime?
  category    String                           // 'gpu'|'datacenter'|'grid'|'water'|'model'|'carbon-accounting'
  variables   Json                             // extracted numbers used
  confidence  String
  lastReviewed DateTime?
}
```
**Design rules baked in:** nullable `model`/`estTokens` (unknown is normal), `inputsJson` for recompute, `clientEventId` for idempotent ingest, `onDelete: Cascade` so delete-all is real, RLS policies (added in Supabase) restricting every row to its `userId`.

---

## 5. AI environmental calculation system

**Deterministic, pure, versioned. Not ML — table lookups + multiplication + uncertainty propagation.** The engineering is trivial; the *credibility discipline* is the product (Feasibility §7).

### 5.1 Pipeline
```
INPUT (from AiSession + AiModel + ResearchSource)
  platform, model(or null), estTokens(or null → conservative default), modelClass
        │
        ▼  ① COMPUTE   tokens × compute-proxy(modelClass)      → est. FLOPs-equivalent
        ▼  ② ENERGY    × energyPerToken(modelClass, GPU assumptions) → Wh (range)
        ▼  ③ PUE       × datacenter overhead factor            → facility Wh (range)
        ▼  ④ CARBON*   × grid carbon intensity (region assumption) → gCO₂ (range)   [*post-MVP]
        ▼  ⑤ WATER*    × water intensity factor                → litres (range)     [*later]
        ▼  ⑥ CONFIDENCE  from input availability               → score + reasons
OUTPUT  { energyWhLow, energyWhHigh, (carbon…), confidence, reasons, methodologyVersion }
```

### 5.2 Inputs, processing, output
- **Inputs:** platform, model (nullable), usage metadata, estimated tokens (nullable). Missing inputs → conservative defaults **and** a confidence penalty (never a silent guess).
- **Processing:** each stage carries a **low/high band**, and bands *multiply through* so uncertainty compounds honestly. Model-class defaults when the specific model is unknown.
- **Output:** an energy **range** (MVP), later carbon/water ranges, a **confidence score + reason checklist**, and the `methodologyVersion` — everything the UX confidence system (§7) and transparency panel need.

### 5.3 Confidence function (the differentiator, in code terms)
```
score = base
  + (modelKnown        ? +w1 : 0)
  + (tokensMeasured    ? +w2 : 0)   // vs. defaulted
  + (regionKnown       ? +w3 : 0)   // usually false → honest Low/Medium
  + (sourceQualityHigh ? +w4 : 0)
reasons = [{ok:modelKnown,label:'model identified'}, {ok:false,label:'data-center location unknown'}, ...]
band → High ≥0.8 · Medium 0.5–0.8 · Low <0.5
```
Weights live in the methodology version so confidence itself is versioned and auditable.

### 5.4 Credibility commitments (non-negotiable)
- **Adopt an open framework** (EcoLogits-style bottom-up modeling / GSF SCI principles / peer-reviewed per-token studies) rather than inventing one — the defensible trust posture (Strategy Review R2, Feasibility §7).
- **Energy-only at launch;** add carbon only after external/academic review (PRD NFR-9).
- **Never emit a lone number;** always range + confidence.
- **Version + publish** methodology; store inputs to recompute history.
- **Validation test** reconciles engine output against the source framework's reference values before public exposure (PRD TR-Test-Estimation-Validation).

---

## 6. MVP development plan (engineering phases)

Aligned with the MVP Development Plan's three gates. Timeline ranges reflect a two-person team; third-party fragility makes precise dates dishonest.

### Phase 1 — Prototype / dogfood (≈ weeks 1–4 of build; gated by demand validation + M1 spike)
- **Features:** ChatGPT + Claude detection; local metadata logging; a throwaway dashboard reading dev data; energy estimate v0.
- **Technical requirements:** adapter interface + 2 adapters against **captured DOM fixtures**; `chrome.storage` persistence; pure estimation module with ranges/confidence; Postgres schema migrated; no auth yet (local).
- **Goal:** prove the pipeline end-to-end *for ourselves* and confirm the M1 spike's data-extraction reality.

### Phase 2 — Functional MVP (≈ weeks 4–12)
- **Features:** onboarding + pre-permission explainer; account (Clerk) **and** local-only; authenticated ingest; server-side estimation; dashboard (Overview, Usage, energy Impact, lightweight Methodology, Settings); pause/export/delete; remote config + kill switch + health telemetry.
- **Technical requirements:** full API with validation/rate-limit/idempotency; RLS; CI content-leak guard; Sentry; adapter-health dashboard; WCAG AA pass on core screens.
- **Goal:** a trustworthy, private, self-monitoring product ready for real users.

### Phase 3 — Beta testing (≈ weeks 12–18+, ≥4 weeks of data)
- **Features:** onboarding polish; store submission; opt-in weekly summary (return-driver, only if needed); feedback link.
- **Technical requirements:** Chrome Web Store review (budget slack); staged rollout; retention/reliability instrumentation (privacy-preserving); a rehearsed breakage-drill using the kill switch.
- **Goal:** hit the PRD success gate (≥25% week-4 retention, ≥80% capture reliability, <10% privacy uninstalls).

---

## 7. Security and privacy

- **Data protection:** metadata-only by construction; **no content columns** exist (DR-2); allowlist payloads; local-only mode.
- **Encryption:** TLS in transit; Supabase encryption at rest; no secrets in the extension bundle (server-side only).
- **Authentication:** managed (Clerk/Supabase Auth) — secure sessions, MFA support; never roll our own.
- **Authorization:** **RLS** so a user can only touch their own rows — defense in depth behind API checks.
- **API security:** authn on every request, per-user rate limits, zod validation, idempotency keys, abuse monitoring on the (semi-public) ingest endpoint.
- **Extension security:** minimal permissions; no remote code (MV3); signed remote *config* only; pinned, scanned dependencies (supply-chain risk in a script that reads AI pages is a headline risk — Dependabot + review).
- **Data retention & user controls:** pause, per-platform toggle, export (machine-readable), delete-all (cascades server + clears local); configurable retention; honor GDPR/CCPA/PIPEDA rights.
- **Verifiability:** open-source the extension so the privacy claim is auditable (UX §8, PRD NFR-13).

---

## 8. Development workflow

### 8.1 Repository structure — **monorepo** (pnpm workspaces + Turborepo)
```
carbon-canvas/
  apps/
    web/            # Next.js dashboard + API + landing
    extension/      # MV3 extension
  packages/
    estimation/     # pure calc engine (shared, unit-tested)
    schema/         # zod + shared types (allowlist payload)
    ui/             # shared React components/design tokens
    config/         # eslint/tsconfig/tailwind presets
  docs/             # these blueprint docs
```
*Why monorepo:* the estimation engine and the allowlist schema are shared by extension, API, and dashboard; one place prevents drift. *Tradeoff:* slightly more build tooling — worth it for a 2-person team keeping contracts in sync.

### 8.2 Branch strategy
- `main` = production-ready (auto-deploy web; extension artifact built).
- `develop` = integration.
- `feature/*`, `fix/*` → PR into `develop`; squash merge; preview deploy per PR.
- Release tags for extension versions (store submissions).

### 8.3 Testing approach (maps to PRD §11)
- **Unit:** estimation engine (ranges/confidence/versioning), tokenizer heuristics.
- **Adapter:** per-platform extraction against **captured DOM fixtures** (incl. long/virtualized chats, unknown-model).
- **Integration:** extension↔ingest↔DB, idempotency, rejection paths.
- **E2E:** Playwright/Chromium (available in CI) — install→onboard→track→dashboard→export→delete + permission-decline path.
- **Privacy guard (blocking):** CI fails if content can reach storage/network.
- **Reliability:** scripted usage suite reports capture accuracy vs. the 80% bar.
- **Estimation validation:** reconcile against source framework before public exposure.

### 8.4 Documentation system
- `docs/` holds the living blueprint + a **Product Decisions Log** (Master Doc §72) and **Methodology changelog**.
- ADRs (Architecture Decision Records) for significant choices.
- Auto-generated API docs from route schemas; README per package.

### 8.5 Deployment workflow
- **Web/API:** Git push → Vercel (preview per PR, prod on `main`).
- **Extension:** CI builds a signed artifact on release tag → manual Chrome Web Store submission (review latency budgeted).
- **Remote config:** edited via a small internal tool/PR → published to CDN; **the breakage-fix fast path** (no store review needed).
- **DB:** Prisma migrations gated in CI; applied on deploy.
- **Rollback:** Vercel instant rollback; config kill switch for adapter emergencies.

---

## 9. Build order (exact sequence — optimized for fast validation, low risk, max learning)

Ordered so the **riskiest cheap-to-test things come first** and nothing expensive is built before its assumption is validated.

1. **Demand validation (no code)** — landing tests, interviews, concierge pilot. *De-risks the whole company before engineering spend.* (Gate 1)
2. **M1 data-extraction spike** — can we actually read platform/turns/model/tokens from ChatGPT + Claude, and what are the error bars? *This is the technical crux; do it before anything else is built.* (Gate 2)
3. **Estimation engine (`packages/estimation`)** — pure, testable in isolation with zero UI/infra. Adopt open methodology; ship ranges + confidence. *High-value, low-risk, fully unit-testable.*
4. **Schema + DB migrations (`packages/schema`, Prisma)** — lock the metadata-only contract and RLS early.
5. **Extension skeleton + adapters against fixtures** — the fragile core, built behind the interface with remote config from day one. Local logging first (no backend needed).
6. **Local-only end-to-end** — extension → local storage → minimal dashboard reading local data. *A usable product with no backend = fastest real dogfooding.*
7. **Backend: auth + ingest + estimation wiring** — turn on sync, accounts, server-side estimates.
8. **Dashboard v1** — Overview → Usage → energy Impact → Methodology → Settings, with confidence + "how calculated" components first (they touch everything).
9. **Resilience: health telemetry + kill switch + remote-config publishing** — before real users, so breakage is survivable.
10. **Privacy/control surfaces + CI privacy guard hardening** — pause/export/delete, guard enforced.
11. **Onboarding + pre-permission explainer polish** — the highest-leverage adoption screens (UX §1.5).
12. **Beta build + store submission + instrumentation** — measure the retention gate.

**Rationale:** steps 1–2 kill the biggest risks for near-zero cost; step 3 builds the differentiated core in isolation; steps 5–6 get a *usable local product* before any backend exists (max learning, min infra); resilience (9) lands before users so the inevitable breakage is a config push, not a fire.

---

## Final deliverables (as requested)

1. **Technical architecture document** — §1 (components, responsibilities, communication, data flow).
2. **Recommended tech stack** — §2 (choice/why/alternatives/tradeoff across frontend, extension, backend, DB, infra).
3. **MVP engineering roadmap** — §6 (Phase 1 prototype → 2 functional MVP → 3 beta) + §9 build order.
4. **Database design** — §4 (Prisma schemas: users, platforms, models, sessions, events, estimates, methodology, research, settings; RLS; no content).
5. **Extension architecture** — §3 (structure, adapter interface, permissions, scripts/worker, privacy protections, per-platform limits).
6. **Development priorities** — §9 build order, optimized for validation/risk/learning.
7. **Engineering risks** — below.

### Engineering risks (ranked, with mitigations)
| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **Scraper breakage** (UI drift on 4 vendors) | Critical, ongoing | Adapters + remote config + kill switch + health telemetry; fixtures; honest "paused" state, never fake data |
| 2 | **Estimate credibility attacked** (10–100× error bars) | Critical | Adopt open methodology; ranges + confidence; version + publish; academic review; energy-only at launch |
| 3 | **Permission-prompt drop-off** | High | Pre-permission explainer; minimal host perms; open-source; local-only option |
| 4 | **Privacy claim breach** (content leaks) | High | Structural (no content columns), allowlist, CI guard, type-level enforcement, open source |
| 5 | **Unknown model/tokens degrade value** | High | First-class "unknown/low-confidence"; conservative defaults; confidence UX turns it into honesty |
| 6 | **Coverage decay** (usage leaving browser) | Medium-High, strategic | Acknowledge; plan mobile/companion later; compete on cross-platform + methodology |
| 7 | **Provider ToS / blocking** | Medium-High | Metadata-only, low-footprint; monitor; legal review; be ready to adapt/disable |
| 8 | **Store review latency** stalls fixes | Medium | Remote config fixes most breaks without a release; budget review time |
| 9 | **Two-person bandwidth** | Medium | Buy commodities (auth/host); monorepo contracts; ruthless MVP scope |
| 10 | **Supply-chain (extension deps)** | Medium | Minimize/pin/scan deps; review; no remote code |

---

## Closing

This blueprint translates the vision into a **buildable, honest, self-monitoring MVP**: a thin fragile edge (adapters + remote config) protecting a solid, testable core (pure estimation engine + metadata-only schema + managed infra), with privacy enforced structurally and credibility earned through published, versioned methodology. Build in the order above — validation and the data-extraction spike *first*, differentiated core *before* infrastructure, resilience *before* users. Only now should implementation begin.
