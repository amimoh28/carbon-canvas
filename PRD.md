# Carbon Canvas — Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | Carbon Canvas |
| **Document** | Product Requirements Document — MVP (v1) |
| **Version** | 1.0 |
| **Status** | Ready for engineering review |
| **Owner** | Product (founder) · Engineering (CTO) |
| **Source inputs** | Master Product Document v1.0; Product Strategy Review; Technical Feasibility Assessment; MVP Development Plan (all in repo) |
| **Scope of this PRD** | The MVP as defined below. Post-MVP items are captured as explicitly out-of-scope with roadmap pointers. |

> **How to read this document.** Requirements are individually IDed (`FR-`, `NFR-`, `DR-`, `TR-`) so they can be tracked, estimated, and tested. Each functional requirement has acceptance criteria. Priority uses MoSCoW (**M**ust / **S**hould / **C**ould / **W**on't-this-phase). Anything marked **Must** is required for a valid MVP; the experiment is invalid without it.

---

## 1. Product overview

### 1.1 Summary
Carbon Canvas is a privacy-first AI usage intelligence platform. Via a Chrome browser extension and a web dashboard, it passively tracks a user's activity on AI assistants (MVP: ChatGPT and Claude), collecting **metadata only — never conversation content** — and presents an honest, transparent view of how they use AI, including one methodology-backed energy estimate.

### 1.2 Vision (context, not MVP scope)
To become the most trusted framework for understanding the environmental impact of everyday AI usage. The MVP is the first, smallest testable step toward that vision.

### 1.3 The MVP hypothesis
**People who use AI heavily will install a passive tracker, return to it regularly, and find an honest view of their usage valuable.** The MVP exists to validate this; every requirement below serves it.

### 1.4 Goals and non-goals

**Goals (MVP)**
- Prove demand and retention for passive AI-usage tracking.
- Establish the privacy-first, transparency-first product DNA in working software.
- Ship a maintainable foundation that survives third-party UI change.

**Non-goals (MVP)**
- Perfect or comprehensive environmental measurement.
- Coverage of every platform, browser, or modality.
- Enterprise, monetization, or public API.
- Any storage or analysis of conversation content.

### 1.5 Key constraints (drive many requirements below)
- **Data source is unofficial DOM extraction** of third-party web apps that change without notice and may prohibit scraping. Fragility is the central engineering reality.
- **No reliable client-side source of tokens or model IDs exists** — these are estimated/inferred, often unavailable. Confidence must be first-class.
- **Two-person team, limited resources.** Buy commodity components (auth, hosting); build only the differentiated core.

---

## 2. User problems

| ID | Problem | Evidence / source |
|---|---|---|
| P-1 | Users cannot see how much AI they use or how it changes over time. | Master Doc §4; no existing cross-platform tracker |
| P-2 | AI usage is fragmented across multiple platforms with no unified view. | Master Doc §9; provider dashboards are siloed |
| P-3 | The environmental impact of AI usage is invisible and hard to understand. | Master Doc §4, §22 |
| P-4 | Existing environmental estimates hide their assumptions and give false-precision single numbers. | Master Doc §4 (Problem 4) |
| P-5 | Privacy-conscious users won't adopt tools that read their conversations. | Master Doc §39; positioning |

**Problem prioritization for MVP:** P-1 and P-2 are the primary wedge (buildable, testable now). P-3/P-4 are addressed with *one* honest energy insight, not a full engine. P-5 is a cross-cutting constraint on the whole design.

---

## 3. User stories

Format: *As a [user], I want [capability], so that [outcome].* Each has acceptance criteria (AC). IDs map to functional requirements in §4.

### Onboarding & privacy
- **US-1 (M):** As a new user, I want to understand exactly what the extension tracks and never touches *before* I grant permissions, so that I can trust it.
  - AC: A plain-language explainer screen precedes the Chrome permission prompt; it names what is collected (metadata) and what is never accessed (conversation text). *(FR-1, FR-15)*
- **US-2 (M):** As a privacy-conscious user, I want the option to use the product without creating an account, so that I can try it with zero data leaving my machine.
  - AC: A "local-only" path exists; in it, no metadata is transmitted and the dashboard reads local data. *(FR-2, FR-16)*

### Tracking
- **US-3 (M):** As a user, I want the extension to automatically detect when I'm using ChatGPT or Claude, so that I don't track anything manually.
  - AC: Opening a supported platform starts a session record without user action. *(FR-3)*
- **US-4 (M):** As a user, I want my session metadata (platform, duration, turn count, model-if-visible) captured accurately, so that my dashboard reflects reality.
  - AC: ≥80% of real sessions are logged with correct platform and a plausible duration/turn count. *(FR-4, FR-5)*
- **US-5 (M):** As a user, I want the extension to never read or store my prompts or the AI's responses, so that my conversations stay private.
  - AC: No conversation text is persisted or transmitted; verified by automated test. *(FR-15, NFR-6, DR-4)*

### Understanding usage
- **US-6 (M):** As a user, I want a dashboard showing my AI usage over time and split by platform, so that I understand my habits.
  - AC: Dashboard shows total sessions, trend over time, and per-platform breakdown. *(FR-7, FR-8)*
- **US-7 (M):** As a user, I want one honest estimate of the energy my AI use required, with its uncertainty shown, so that I get environmental insight without false precision.
  - AC: An energy figure is shown as a range with a confidence level and a "how was this calculated?" link. *(FR-9, FR-10)*
- **US-8 (M):** As a skeptical user, I want to see the methodology, sources, and assumptions behind any estimate, so that I can judge its credibility.
  - AC: A transparency panel shows formula summary, key assumptions, sources, methodology version, and confidence. *(FR-10)*

### Control
- **US-9 (M):** As a user, I want to pause tracking, export my data, and delete everything, so that I stay in control.
  - AC: Pause, export (machine-readable), and delete-all are available and functional. *(FR-11, FR-12, FR-13)*
- **US-10 (S):** As a returning user, I want a lightweight weekly summary, so that I have a reason to come back.
  - AC (fast-follow, only if base retention is weak): opt-in weekly summary of usage. *(FR-14)*

### Operability (team-facing, enables the above)
- **US-11 (M):** As the team, we want to detect when platform DOM changes break tracking and disable a broken adapter remotely, so that users never see garbage data.
  - AC: Health telemetry flags zero-match selectors; a server-side kill switch can disable an adapter without an extension release. *(FR-17, FR-18)*

---

## 4. Functional requirements

Grouped by component. Priority in brackets.

### 4.1 Browser extension
- **FR-1 [M] — Pre-permission explainer.** Before requesting host permissions, display a screen stating what is collected and what is never accessed.
  - *AC:* Explainer shown on first run; permission prompt only fires after acknowledgment.
- **FR-2 [M] — Account or local-only choice.** User can proceed with an account or in local-only mode.
  - *AC:* Both paths reach a working popup; local-only transmits nothing.
- **FR-3 [M] — Platform detection.** Detect active use of ChatGPT (`chatgpt.com`/`chat.openai.com`) and Claude (`claude.ai`) via content scripts.
  - *AC:* Navigating to a supported platform creates/attaches to a session.
- **FR-4 [M] — Session metadata capture.** Capture platform, session start/end, duration, and turn count.
  - *AC:* Values persist to local storage immediately (MV3 worker may be killed mid-session); ≥80% capture reliability.
- **FR-5 [S] — Model + token enrichment (low-confidence).** When visible, capture model name; estimate tokens by local re-tokenization of visible text.
  - *AC:* Model captured when the UI exposes it; token value is stored with a low-confidence flag; absence is handled gracefully as "unknown."
- **FR-6 [M] — Popup summary.** Show today's activity (sessions, approximate time, platform split) and a dashboard link.
  - *AC:* Popup renders current-day metadata from local/synced store.
- **FR-15 [M] — Content firewall.** Conversation text is read only in-page to compute counts and is immediately discarded; never persisted, never transmitted.
  - *AC:* Automated test proves no message text reaches storage or network (see TR-5).
- **FR-16 [M] — Metadata-only sync.** When an account is used, sync a strict allowlist of scalar metadata fields only.
  - *AC:* Sync payload schema rejects any non-allowlisted field.

### 4.2 Resilience & operability
- **FR-17 [M] — Health telemetry.** Extension reports anonymized adapter-health signals (e.g., selector match counts), using the same metadata-only discipline.
  - *AC:* A dashboard/alert surfaces when an adapter's match rate drops sharply.
- **FR-18 [M] — Remote config + kill switch.** Selectors/feature flags are remotely configurable (config, not code, per MV3); a broken adapter can be disabled server-side.
  - *AC:* Changing remote config updates selector behavior without a store release; kill switch stops a broken adapter from emitting data.

### 4.3 Backend & estimation
- **FR-19 [M] — Authenticated ingest.** Accept batched metadata events over an authenticated, validated, rate-limited endpoint with idempotency.
  - *AC:* Unauthenticated or malformed requests rejected; duplicate batches don't double-count.
- **FR-9 [M] — Energy estimation service.** Deterministic, versioned pipeline converting usage metadata into an energy estimate as a **range with a confidence score**.
  - *AC:* Output always includes low/high bounds, confidence, and `methodology_version`; single bare numbers are never emitted.
- **FR-10 [M] — Transparency payload.** Every estimate carries its methodology summary, key assumptions, sources, and confidence for display.
  - *AC:* Dashboard transparency panel is fully populated from this payload.

### 4.4 Web dashboard
- **FR-7 [M] — Usage overview.** Show total sessions, usage trend over time, and per-platform breakdown.
- **FR-8 [M] — Usage detail.** Show session history and (when available) model breakdown.
  - *AC:* Sessions with unknown model render as "unknown," not errors.
- **FR-11 [M] — Pause tracking.** User can pause/resume collection.
- **FR-12 [M] — Export data.** User can export their data in a machine-readable format.
- **FR-13 [M] — Delete data.** User can delete all their data; deletion is honored across extension and backend.
  - *AC:* After delete, no user rows remain server-side and local buffers are cleared.
- **FR-14 [S] — Weekly summary.** Opt-in weekly usage summary (fast-follow return-driver).

### 4.5 Out of scope (this phase) — with roadmap pointers
- **FR-W1 [W]** Carbon and water estimates (add carbon after energy survives external review — see NFR-9; water later, wider error bars).
- **FR-W2 [W]** AI Efficiency Score, Personal AI Profile, AI Receipts, notifications, model benchmarking.
- **FR-W3 [W]** Gemini, Perplexity, Copilot, Grok adapters; Firefox/Edge/Safari.
- **FR-W4 [W]** Enterprise/team features, public API, social/sharing, mobile.

---

## 5. Non-functional requirements

- **NFR-1 [M] — Performance (extension).** Content scripts must not perceptibly slow the AI page. *AC:* No measurable interaction-latency regression; observers debounced.
- **NFR-2 [M] — Reliability (worker).** No session state may live only in the MV3 service worker (it is killed on idle); all state persists to `chrome.storage` promptly. *AC:* Killing the worker mid-session loses no committed data.
- **NFR-3 [M] — Data-capture accuracy.** ≥80% of real sessions logged with correct platform and plausible metrics. *AC:* Verified against a scripted usage test suite (TR-3).
- **NFR-4 [M] — Availability.** Dashboard/API target ≥99% at MVP scale (managed hosting handles this).
- **NFR-5 [M] — Scalability.** Support low-thousands of users on a single Postgres instance without re-architecture. Warehouse/partitioning explicitly deferred.
- **NFR-6 [M] — Privacy by construction.** The system is incapable of storing conversation content (no schema field exists; CI guard enforces). *AC:* TR-5 passes in CI.
- **NFR-7 [M] — Security.** TLS in transit; encryption at rest; RLS on all user tables; minimal extension permissions; no secrets in the client bundle; dependency pinning + scanning. (Detail in §8.)
- **NFR-8 [M] — Accessibility.** Dashboard targets WCAG 2.2 AA: keyboard nav, screen-reader support, sufficient contrast, chart text alternatives; light/dark mode.
- **NFR-9 [M] — Estimate credibility.** Estimation methodology must be based on a published open framework, versioned, and publicly documented; energy-only at launch; carbon added only after external/academic review. *AC:* Methodology page live before public exposure; sources cited.
- **NFR-10 [M] — Maintainability.** Per-platform logic isolated behind a common adapter interface so a broken/added platform touches one module. *AC:* Adding/removing an adapter requires no change to core pipeline.
- **NFR-11 [S] — Compliance readiness.** Support data access/export/deletion and consent consistent with GDPR/CCPA/PIPEDA; green-claims wording reviewed before user-facing launch. *AC:* Export/delete implemented (FR-12/13); estimate copy legal-reviewed.
- **NFR-12 [M] — Recomputability.** Store estimation *inputs*, not just outputs, so historical estimates can be recomputed under new methodology versions. *AC:* Any past session can be re-estimated.
- **NFR-13 [S] — Verifiability.** Extension source is open-sourced to substantiate the privacy claim. *AC:* Public repo of the extension by public launch.

---

## 6. User flows

### 6.1 Install & onboard (critical — the permission moment)
```
Landing page → "Add to Chrome"
  → [FR-1] Plain-language explainer (what we track / never touch)
  → Chrome host-permission prompt (chatgpt.com, claude.ai)
  → [FR-2] Choose: create account  OR  local-only
  → Popup confirms "You're set — use AI as normal."
```
Failure/edge: user declines Chrome permission → extension explains it can't function and offers local-only info; no dark patterns.

### 6.2 Passive tracking (silent)
```
User opens ChatGPT/Claude
  → [FR-3] content script detects platform
  → observes turns, times session, reads text in-page for counts
  → [FR-15] discards text; [FR-4/5] persists metadata to chrome.storage
  → [FR-16] batched metadata syncs (if account)  |  stays local (if local-only)
  → [FR-17] health signals reported
```

### 6.3 Understand usage
```
Open dashboard
  → [FR-7] usage overview + trend + platform split
  → [FR-9] one energy estimate (range + confidence)
  → [FR-10] "How was this calculated?" → methodology, assumptions, sources
  → [FR-8] drill into session history / model breakdown
```

### 6.4 Control
```
Settings → [FR-11] pause/resume · [FR-12] export · [FR-13] delete-all
```

### 6.5 Breakage handling (team flow)
```
[FR-17] telemetry shows adapter match-rate drop
  → alert → team pushes [FR-18] remote-config selector fix
     └─ if unfixable fast → kill switch disables adapter (no garbage shown)
  → users see "tracking temporarily paused for <platform>" rather than wrong data
```

---

## 7. MVP scope (authoritative)

**In scope (Must):** Chrome MV3 extension; ChatGPT + Claude adapters behind a common interface; pre-permission explainer; account + local-only; session metadata capture (platform, duration, turns; model/tokens as low-confidence enrichment); content firewall; metadata-only sync; health telemetry + remote config + kill switch; authenticated ingest; versioned energy estimation with ranges/confidence/transparency; dashboard (overview, trend, platform split, session history, transparency panel); pause/export/delete; WCAG 2.2 AA; published methodology.

**Fast-follow (Should, only if retention is borderline):** weekly summary; model-breakdown polish.

**Out of scope this phase (Won't):** carbon/water estimates; efficiency score; AI profile; receipts; notifications; benchmarking; Gemini/Perplexity/other platforms; other browsers; enterprise/team; public API; social; mobile.

**Explicitly assumed-impossible (do not design around):** reliable cross-platform token/model accuracy; coverage of native apps/voice/embedded AI; exact per-prompt emissions; single-number precision; provider ToS tolerance guaranteed; stable third-party DOMs.

---

## 8. Technical requirements

- **TR-Stack [M]:** Extension = Manifest V3 + TypeScript. Web = Next.js + TypeScript + Tailwind + shadcn/ui + Recharts. Backend = Next.js API routes (monolithic at MVP). DB = Postgres via Supabase + Prisma, RLS on. Auth = Clerk (or Supabase Auth) — do not build auth. Hosting = Vercel (web) + Supabase (data).
- **TR-Adapters [M]:** Each platform is an isolated module implementing a common `PlatformAdapter` interface (detect, observe turns, extract model-if-any, compute counts). Core pipeline is platform-agnostic. *(NFR-10)*
- **TR-RemoteConfig [M]:** Selectors and feature flags delivered as signed remote **config** (not executable code, per MV3). Includes per-adapter enable/disable (kill switch). *(FR-18)*
- **TR-Worker [M]:** Treat the MV3 service worker as ephemeral; persist to `chrome.storage` on every state change; reconstruct on wake. *(NFR-2)*
- **TR-Ingest [M]:** Authenticated, schema-validated, rate-limited, idempotent batch ingest. Reject non-allowlisted fields. *(FR-19, FR-16)*
- **TR-Estimation [M]:** Deterministic, server-side, versioned; implements an open methodology (EcoLogits / GSF SCI / academic per-token); propagates uncertainty to a range + confidence; stores inputs for recompute. *(FR-9, NFR-9, NFR-12)*
- **TR-Observability [M]:** Error tracking, basic performance monitoring, and adapter-health dashboards/alerts. *(FR-17)*
- **TR-CI [M]:** Lint/typecheck/tests in CI, including a **content-leak guard** that fails the build if message text can reach storage/network. Dependency scanning (Dependabot). *(NFR-6, NFR-7)*
- **TR-Excluded [M]:** No microservices, queues, warehouse, GraphQL, Kubernetes, or mobile frameworks at MVP. Add only on demonstrated need.

---

## 9. Data requirements

- **DR-1 [M] — Core entities:**
  - `users` (id, email, preferences, created_at)
  - `connected_platforms` (user_id, platform, status, connected_at)
  - `ai_sessions` (id, user_id, platform, model **nullable**, start, end, duration, turn_count, est_tokens **nullable**, token_confidence, created_at)
  - `estimates` (id, session_id, energy_low, energy_high, energy_confidence, methodology_version, inputs_json)
  - `methodology_versions` (version, summary, assumptions, released_at)
  - `research_sources` (id, title, author, org, url, pub_date, category, confidence)
- **DR-2 [M] — No content columns.** No table stores prompts, responses, files, or any conversation text. Privacy enforced at the schema level. *(NFR-6)*
- **DR-3 [M] — Nullable unknowns.** `model`, `est_tokens`, and confidence fields are nullable/first-class; "unknown/low-confidence" is a normal state, never an error.
- **DR-4 [M] — Metadata-only sync payload.** Transmitted fields are a strict scalar allowlist matching `ai_sessions` metadata; validated server-side.
- **DR-5 [M] — Store inputs for recompute.** `estimates.inputs_json` retains the exact inputs used, enabling re-estimation under new methodology. *(NFR-12)*
- **DR-6 [M] — Isolation.** Row-Level Security ensures a user can only read/write their own rows.
- **DR-7 [M] — Retention & rights.** Support per-record and full deletion and export; define a default retention policy; local-only mode persists nothing server-side.
- **DR-8 [S] — Aggregation (later).** Any future research/benchmark dataset must be anonymized and aggregated; **no sale of personal or conversation data, ever** (per Master Doc §62).

---

## 10. Success metrics

### 10.1 MVP validation gate (pre-committed pass/fail)
| Metric | Target | Rationale |
|---|---|---|
| Beta users completing onboarding | ≥ 100 | Minimum signal base |
| **Week-4 retention** | **≥ 25%** | The decisive habit signal |
| Users who correctly explain an estimate | ≥ 40% | Transparency positioning must land |
| Uninstalls citing privacy/permissions | < 10% | Guards the permission-moment risk |
| Session-capture reliability | ≥ 80% | Below this, the product misleads users |

### 10.2 Supporting KPIs (instrument from day one)
- **Acquisition:** landing→waitlist conversion (by framing), installs, onboarding completion.
- **Engagement:** DAU/MAU, dashboard revisits, sessions tracked.
- **Retention:** D7 / D30, weekly returning users.
- **Quality:** adapter match-rate, error rate, capture accuracy, estimate stability.
- **Trust:** % who can state the privacy guarantee; transparency-panel open rate.

### 10.3 What we explicitly do *not* optimize at MVP
Revenue, enterprise seats, viral coefficient — measured later; not MVP success criteria.

---

## 11. Testing requirements

- **TR-Test-Unit [M]:** Unit tests for the estimation pipeline (ranges, confidence, versioning), tokenizer heuristics, and utilities. *AC:* Estimation math covered including boundary/uncertainty cases.
- **TR-Test-Adapter [M]:** Per-adapter extraction tests against **captured DOM fixtures** for ChatGPT and Claude (including long/virtualized chats and "unknown model" cases). *AC:* Adapters validated against saved snapshots; fixture refresh is a routine task.
- **TR-Test-Integration [M]:** Extension↔ingest↔DB flow; idempotency; malformed/unauthorized rejection. *AC:* Duplicate batches don't double-count; bad payloads rejected.
- **TR-Test-E2E [M]:** Full journeys — install→onboard→track→dashboard→export→delete — via browser automation (Playwright/Chromium available in CI). *AC:* Happy path and permission-decline path both pass.
- **TR-Test-Privacy [M] (TR-5):** Automated guard proving no conversation text reaches storage or network; runs in CI and blocks merge on failure. *AC:* Intentional leak in a test branch fails the build.
- **TR-Test-Reliability [M]:** Scripted usage suite measuring capture accuracy against the ≥80% bar (NFR-3). *AC:* Reported per platform each build.
- **TR-Test-Security [S]:** Authn/permission/data-protection checks; dependency vulnerability scan in CI. *AC:* No high-severity known vulns at release.
- **TR-Test-A11y [S]:** Accessibility checks against WCAG 2.2 AA (automated + keyboard/screen-reader spot checks). *AC:* No AA blockers on core dashboard.
- **TR-Test-Estimation-Validation [M]:** Cross-check estimate outputs against the source open methodology's reference values before public exposure. *AC:* Outputs reconcile with the referenced framework within documented tolerances. *(NFR-9)*
- **TR-Test-Breakage-Drill [S]:** Rehearse the remote-config fix + kill-switch path during beta. *AC:* A simulated selector break is resolved via config without a store release.

---

## 12. Open items to resolve before/at kickoff

These are decisions (not requirements) that gate or shape the build; from the Strategy Review and Feasibility Assessment. Track in the Product Decisions Log.

1. **Primary identity framing** (sustainability vs. usage-intelligence) — resolve with the landing-page test; it sets dashboard hierarchy and copy.
2. **Energy-only vs. include carbon at launch** — recommend energy-only until external review (NFR-9).
3. **Account-default vs. local-only-default** — affects onboarding, infra, and how strong the privacy claim can be.
4. **Methodology framework selection** (EcoLogits / GSF SCI / academic composite) — blocks the estimation service.
5. **Trademark/name check on "Carbon Canvas."**
6. **Green-claims legal review** of estimate wording (NFR-11).

---

## Appendix A — Requirement index
- **FR-1…FR-19** Functional (extension, resilience, backend/estimation, dashboard).
- **NFR-1…NFR-13** Non-functional (performance, privacy, security, accessibility, credibility, maintainability).
- **DR-1…DR-8** Data (schema, privacy-by-construction, isolation, rights).
- **TR-*** Technical & testing.

## Appendix B — Traceability (problem → story → requirement)
- P-1/P-2 → US-3,4,6 → FR-3,4,7,8
- P-3 → US-7 → FR-9
- P-4 → US-8 → FR-10, NFR-9
- P-5 → US-1,2,5,9 → FR-1,2,11,12,13,15,16; NFR-6; DR-2,4,6

*This PRD is scoped to the MVP by deliberate design (see Strategy Review and MVP Development Plan). Post-MVP capabilities from the Master Product Document remain on the roadmap and are marked **Won't-this-phase**, not cancelled.*
