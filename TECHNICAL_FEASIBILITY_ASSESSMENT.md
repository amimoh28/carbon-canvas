# Carbon Canvas — Technical Feasibility Assessment

**Author:** Acting CTO
**Inputs:** Master Product Document v1.0 (July 2026); Product Strategy Review (this repo)
**Status:** Pre-development engineering assessment. No code yet.
**Purpose:** Establish what is technically real, what is brittle, and what is fantasy — and pin down the smallest architecture that can actually ship and learn.

---

## Executive summary (read this first)

The product is buildable, but **its foundation is the single most fragile kind of software there is: an unofficial scraper of adversarially-changing, possibly-hostile third-party web apps.** Everything downstream — analytics, carbon estimates, receipts, enterprise — inherits that fragility.

Three engineering realities dominate every decision below:

1. **We do not have the data we think we have.** There is no reliable, cross-platform source of tokens, model IDs, or interaction counts. We *infer* them from the DOM, and the DOM is not ours. Confidence must be a first-class data field, not a UI afterthought.
2. **The carbon "engine" is a lookup-and-multiply pipeline, not ML.** It is easy to build and hard to make *credible*. The engineering is trivial; the research inputs are the product. Do not let the word "engine" imply sophistication we don't have.
3. **Maintenance, not construction, is the real cost.** Building v1 is a few weeks. *Keeping it working* across four vendors' UI redesigns is a permanent, unbounded operational commitment. Architect for breakage as the default state.

My recommendation: build a deliberately small MVP (one browser, two platforms, session-level metadata, one honest energy insight), instrument it to detect its own breakage, and treat everything else in the document as post-validation.

---

## 1. Browser extension feasibility

**Verdict: Feasible to build, expensive to keep alive. This is the crux of the whole product.**

### What Manifest V3 gives us
- **Content scripts** injected into `chat.openai.com`/`chatgpt.com`, `claude.ai`, `gemini.google.com`, `perplexity.ai` — can read the DOM, observe mutations, and detect navigation.
- **Background service worker** — event-driven, non-persistent. Manages state, batches, and syncs. Note: MV3 killed long-lived background pages; the worker is killed after ~30s idle, so **no in-memory session state can be trusted** — everything must persist to `chrome.storage` immediately. This is a real design constraint, not a footnote.
- **`chrome.storage.local`** for local buffering; **popup** for the at-a-glance UI.

### Where it hurts
- **DOM scraping is unofficial and unsupported.** None of these vendors publish a stable UI contract. Class names are hashed/minified and rotate; React re-renders replace nodes; A/B tests mean two users see different DOMs on the same day. Selectors *will* break, silently, and we find out from a metrics drop, not an error.
- **Chrome Web Store review latency.** When a selector breaks, the fix ships only after CWS re-review (typically hours to days, occasionally longer). That is a window of dead/wrong data we cannot eliminate — only shorten with remote config (see §10).
- **Permission friction.** To read those pages we must request host permissions on the AI domains. Chrome shows the user "read and change your data on chatgpt.com, claude.ai…" — alarming to exactly the privacy-conscious user we court. This is a conversion problem masquerading as a technical one.
- **MV3 constraints** on remote code: we cannot `eval` downloaded selector logic as code. Remote *config* (declarative selector strings, feature flags) is allowed and is our primary resilience lever; remote *code* is not.

**Must build for MVP:** MV3 extension, content scripts for two platforms, service worker with immediate persistence, popup, remote-config-driven selectors.
**Nice to have later:** Firefox/Edge ports (mostly portable), Safari (expensive — different extension model, App Store).
**Impossible/risky:** Assuming selectors are stable; assuming one DOM per platform; assuming instant fix deployment.

---

## 2. What data can realistically be collected

Be honest about the tiers. This table is the most important thing in the document for scoping.

| Signal | Reliability | How | Notes |
|---|---|---|---|
| **Which platform** | **High** | URL / hostname | The only truly reliable signal. |
| **Session occurred / active** | **High** | Tab focus + DOM activity | "User was on an AI site and interacting." |
| **Session duration** | **Medium-High** | Focus/blur timers | Confounded by idle tabs left open; needs an activity heuristic. |
| **Prompt/turn count** | **Medium** | Count message DOM nodes | Breaks on virtualized/windowed message lists (long chats unload old turns from DOM). |
| **Model used** | **Low-Medium** | Read model-picker text | Often hidden, defaulted, or "Auto" routed server-side. Frequently unknowable. |
| **Token count** | **Low (estimate only)** | Client-side re-tokenization of visible text | See below — this is an *estimate of an estimate*. |
| **Input vs output tokens** | **Low** | Segment user vs assistant nodes | Degrades with the same virtualization problem. |
| **Actual energy/carbon** | **Not collectable** | — | Never available client-side. Always modeled. |

### The token problem, specifically
There is no token counter in these UIs. To estimate tokens we must (a) read the message text — which sharpens the privacy tension (§4) — and (b) re-tokenize it locally. But each provider uses a *different* tokenizer (OpenAI `tiktoken` variants, Claude's tokenizer, Gemini's SentencePiece), and we won't perfectly replicate them. Realistic accuracy: character-count or word-count heuristics good to maybe ±20–30% on visible text, worse when the DOM has unloaded part of a long conversation. **Reasoning-model "thinking" tokens, tool calls, retrieval, and system prompts are entirely invisible to us and can dwarf visible tokens** — this alone can make our token estimate wrong by multiples for exactly the reasoning-heavy usage that matters most.

**Must build for MVP:** platform, session, duration, turn count. Treat tokens as a *low-confidence enrichment*, not a core metric.
**Nice to have later:** Better tokenizer parity per platform.
**Impossible/risky:** Believing our token counts are accurate; counting hidden reasoning/system/tool tokens; anything for voice or non-text modalities.

---

## 3. Platform-specific limitations (ChatGPT, Claude, Gemini, Perplexity)

- **ChatGPT (chatgpt.com):** Highest usage, so highest priority — but heavy A/B testing and frequent redesigns; model routing increasingly opaque ("Auto"); message virtualization on long chats. Desktop and mobile apps (a large and growing share of usage) are completely invisible to a browser extension.
- **Claude (claude.ai):** Cleaner, more stable DOM historically; model name usually visible in the picker; Projects/artifacts add DOM complexity. Also has desktop/mobile apps we can't see. **Reasonable choice for platform #2** in the MVP because of relative DOM stability.
- **Gemini (gemini.google.com):** Deep Google web stack; obfuscated, frequently-changing markup; also surfaced inside Workspace (Docs/Gmail) where our extension has no footprint. Higher scraping cost.
- **Perplexity:** Different interaction model (search + sources, "Pro" reasoning), so "prompt count" and "model" map poorly onto our schema. Lower early-adopter overlap with our persona. **Defer past MVP.**

**Cross-cutting hard limits on all four:**
- No official usage API for consumer accounts. (Provider *platform* APIs exist for developers, but they measure API calls, not the human's web session — different product.)
- ToS/automated-collection risk: scraping may violate terms; a vendor can block extensions or obfuscate to defeat us at any time.
- The usage is **leaving the browser** — apps, voice, IDE copilots, embedded assistants. Our measurable share shrinks over time even if we do everything right.

**Must build for MVP:** ChatGPT + Claude adapters only.
**Nice to have later:** Gemini, Perplexity, Copilot, Grok, open-source UIs.
**Impossible/risky:** Any coverage of native apps, voice, or embedded AI from a browser extension; assuming ToS tolerance.

---

## 4. Privacy architecture

Privacy is our marketing spine, so the architecture must make the promise *technically true*, not just stated.

### The core tension
To count turns and estimate tokens, the content script **must read conversation text in the DOM.** So "we never collect your conversations" is imprecise. The technically-honest and defensible claim is:

> **"Content is read only in-page to compute counts, is never stored, and is never transmitted. Only derived metadata leaves your browser."**

That is a subtler promise and a bigger engineering obligation. To make it real:

- **Local-first processing (mandatory, not "future"):** All text touches memory only inside the content script; we compute length/turn metrics there and **discard the text immediately.** Only numbers (`turns: 14`, `est_tokens: 5200`, `model: "claude-…"`, `duration_s: 640`) are persisted or synced.
- **No content in storage or logs — ever.** Enforced by schema (there is no column for it) and by a lint/CI check that fails if raw message text reaches the storage/network layer.
- **Data minimization by construction:** the sync payload is a strict allowlist of scalar fields.
- **User control:** pause tracking, per-platform toggle, local view, export, delete-all. These are cheap and enormously trust-building.
- **Local-only mode:** a setting where nothing syncs at all and the dashboard reads from local storage. This is the single strongest proof of the privacy claim and should exist early.
- **Open-source the extension:** the only way a skeptical technical audience can *verify* the promise. Near-mandatory given the positioning.

**Must build for MVP:** local computation + discard, metadata-only sync, allowlist payload, pause/export/delete, CI guard against content leakage.
**Nice to have later:** Full local-only mode toggle, third-party audit, zero-knowledge/aggregation schemes.
**Impossible/risky:** Marketing "we never read your conversations" verbatim (false); any design that persists raw text "temporarily."

---

## 5. Backend requirements

**Verdict: Deliberately boring. The backend is not where the risk or the value is.**

For an MVP that ingests small metadata events and serves a dashboard, requirements are modest:

- **Auth:** managed provider (Clerk or Supabase Auth / Auth.js). Do not build auth.
- **Ingest API:** a thin authenticated endpoint accepting batched session/event metadata. Validate hard, rate-limit, idempotency keys (extension retries must not double-count).
- **Estimation service:** runs the carbon/energy pipeline (§7) — deterministic, versioned, server-side so methodology updates don't require an extension release.
- **Analytics/aggregation:** daily/weekly/monthly rollups. At MVP scale this is SQL, not a data pipeline.
- **Stack fit:** the document's Next.js + Supabase/Postgres + Prisma choice is appropriate — fast, proven, cheap, and lets a small team (or a supervised founder-led build) move quickly. No microservices, no Kafka, no warehouse at MVP. The document's own "avoid unnecessary complexity" principle is correct; honor it.

**Must build for MVP:** auth (managed), validated ingest endpoint, versioned estimation service, SQL rollups.
**Nice to have later:** Queue/worker for heavy async jobs, warehouse for research/aggregate analytics, GraphQL, public API.
**Impossible/risky:** Real-time provider data feeds; "API integrations" with the AI vendors for usage (they don't offer this).

---

## 6. Database requirements

Postgres (via Supabase) is right. The schema is simple; the discipline is in what it **cannot** store.

Core tables (MVP): `users`, `connected_platforms`, `ai_sessions` (platform, model-or-null, start/end, duration, turn counts, **estimated** tokens, confidence), `estimates` (session_id, energy/carbon/water ranges, methodology_version, confidence), `methodology_versions`, `research_sources`.

Design rules:
- **No content columns anywhere.** Privacy enforced at the schema level.
- **Every estimate carries `methodology_version` and `confidence`.** Because methodology will change, historical estimates must be reproducible/re-computable. Store inputs, not just outputs, so we can re-run old sessions under new methodology.
- **Nullable model + confidence everywhere.** "Unknown model, low confidence" is a first-class, common state — not an error.
- **Row-level security** (Supabase RLS) so users can only ever read their own rows.
- Scale at MVP (thousands of users, a few events each per day) is trivial for Postgres. Partitioning/warehouse concerns are Phase 4+ problems.

**Must build for MVP:** the six tables above with RLS, methodology versioning, stored inputs.
**Nice to have later:** aggregate/anonymized research tables, partitioning, read replicas.
**Impossible/risky:** Storing conversation content "just in case"; assuming estimates never need recomputation.

---

## 7. AI carbon estimation engine requirements

**Verdict: Trivial to engineer, and that is the trap. The credibility — not the code — is the deliverable.**

Mechanically it is a deterministic pipeline:
```
estimated tokens → compute (FLOPs/token proxy by model class)
→ energy (Wh, via GPU efficiency + utilization assumptions)
→ × PUE (datacenter overhead)
→ × grid carbon intensity (region assumption) → gCO₂
→ × water intensity factor → litres
→ attach confidence + methodology_version
```
No ML. It is table lookups and multiplication with uncertainty propagation.

### Why it is hard anyway
- **Every input is an assumption we can't verify:** which GPU, utilization, batch size, MoE active-parameter fraction, caching/speculative decoding, datacenter location, grid mix, cooling type. For closed frontier models, honest error bars are **10–100×**.
- **The invisible-token problem (§2)** compounds this: if we can't see reasoning/system/tool tokens, the *input* to this pipeline is already wrong by multiples.
- **Public estimates in this space are actively contested.** The first credible "your numbers are wrong" post damages the whole brand.

### The only responsible way to build it
- **Do not invent methodology.** Implement and extend an existing open framework (EcoLogits-style bottom-up modeling, Green Software Foundation SCI principles, published academic per-token studies). "We implement the open standard" is a far stronger trust posture for an unknown startup than "trust ours."
- **Propagate uncertainty end-to-end.** The output is always a range with a confidence score. Never a bare number.
- **Version everything and publish it.** Open methodology, cited sources, changelog.
- **Get academic review before launch,** not after the takedown.

**Must build for MVP:** deterministic energy→carbon pipeline for a *few known model classes*, ranges + confidence, one methodology version, published assumptions. Consider **shipping energy only in v1 and deferring carbon/water** until the numbers survive review.
**Nice to have later:** water model (wider error bars, do it later), per-region grid intensity, model-specific benchmarks, provider-sourced data if any relationship exists.
**Impossible/risky:** "Exact emissions per prompt"; single-number outputs; proprietary-methodology-as-moat; trusting our own token inputs for reasoning models.

---

## 8. Security considerations

Standard SaaS security; nothing exotic, but a few extension-specific items matter.

- **Extension is the attack surface.** Minimal host permissions, no `eval`, strict CSP, no remote code (MV3 enforces), signed remote *config* only.
- **Ingest endpoint:** authn on every request, per-user rate limits, strict input validation, idempotency keys, abuse monitoring. A public-ish ingest endpoint invites junk data.
- **Encryption** in transit (TLS) and at rest (Supabase-managed) — table stakes.
- **RLS** as the last line so an API bug can't leak cross-user data.
- **Supply chain:** the extension's npm dependencies are a real risk (a compromised dep in a content script that reads AI pages is a nightmare headline). Pin, audit, minimize deps, Dependabot.
- **Secrets/keys** server-side only; never in the extension bundle.
- **Because we handle "what AI people use,"** a breach is reputationally worse than the data's raw sensitivity implies. Security posture must exceed what the tiny dataset would suggest.

**Must build for MVP:** minimal perms, validated/rate-limited ingest, TLS+at-rest, RLS, dep pinning/scanning.
**Nice to have later:** SOC 2 / ISO 27001, formal pen test, bug bounty.
**Impossible/risky:** Trusting client-submitted metadata without server validation; shipping secrets in the extension.

---

## 9. Development complexity

Honest effort ranking (hardest first) — note that difficulty is dominated by *external fragility and credibility*, not code volume:

1. **Keeping scrapers working (permanent, unbounded).** The real cost center. Needs monitoring + fast remote-config fixes + on-call attention. This never ends.
2. **Credible methodology (research, not engineering).** Slow, expert-dependent, reputationally load-bearing.
3. **Reliable per-platform data extraction (high, ongoing).** Especially model + tokens.
4. **Privacy guarantees done right (medium, mostly discipline).** CI guards, local-only mode, audit.
5. **Dashboard + analytics (medium, well-trodden).** Next.js + Recharts; straightforward.
6. **Backend + DB (low-medium).** Boring on purpose.
7. **Auth (low).** Buy it.

**Critical staffing reality:** the document's plan to hire technical leadership *after* the company "grows" inverts the dependency — **nothing ships and nothing survives breakage without engineering ownership from day one.** The hardest, most persistent work (items 1–3) cannot be a supervised-by-a-non-technical-founder afterthought. This is a pre-build blocker, not a scaling concern.

---

## 10. Recommended MVP technical architecture

**Design goal: the smallest system that produces one honest, valued insight and can detect its own breakage.**

```
┌──────────────────────── Browser (Chrome, MV3) ───────────────────────┐
│  Content scripts (thin per-platform ADAPTERS: ChatGPT, Claude)        │
│    • detect platform, observe turns, time session                     │
│    • read text in-page → compute counts → DISCARD text                │
│    • emit metadata-only events                                        │
│  Service worker: persist-immediately, batch, sync                     │
│  Popup: today's activity + dashboard link                            │
│  chrome.storage.local: buffer + preferences (local-only mode)        │
│  Remote CONFIG (not code): selectors + feature flags + kill switch    │
└───────────────────────────────┬──────────────────────────────────────┘
                                 │  HTTPS, metadata-only allowlist payload
                                 ▼
┌──────────────────────────── Backend ─────────────────────────────────┐
│  Managed Auth (Clerk / Supabase Auth)                                │
│  Ingest API (Next.js route): validate, rate-limit, idempotent        │
│  Estimation service: versioned energy(→carbon?) pipeline + ranges    │
│  Aggregation: SQL rollups (daily/weekly/monthly)                     │
└───────────────────────────────┬──────────────────────────────────────┘
                                 ▼
        Postgres / Supabase (RLS, no content columns, versioned estimates)
                                 ▲
                                 │
        Next.js dashboard (Recharts): usage overview + ONE energy insight
                                 + "how was this calculated?" transparency
```

### Architectural commitments that matter
- **Adapters, not a monolith scraper.** Each platform is an isolated module behind a common interface, driven by **remote config** so a broken selector is fixed by pushing config — not by waiting on Chrome Web Store review.
- **Self-monitoring / drift detection.** The extension reports anonymized *health* signals ("selector X matched 0 nodes for N sessions"). We must learn about breakage from telemetry, not from a user tweet. Include a server-side **kill switch** to disable a broken adapter cleanly rather than emit garbage.
- **Confidence is plumbed end-to-end,** from extraction through estimate to the pixel.
- **Estimation is server-side and versioned,** so methodology improves without shipping the extension and old sessions can be recomputed.
- **Content never leaves the content script.** Enforced by schema and CI.

### MVP scope line (what actually ships v1)
- Chrome only; **ChatGPT + Claude** only.
- Session-level metadata: platform, duration, turn count, model-if-visible, low-confidence token estimate.
- Dashboard: usage overview + trends + **one** honest energy insight with visible methodology.
- Privacy: local compute + discard, metadata-only sync, pause/export/delete.
- Health telemetry + remote config + kill switch from day one.

### Explicitly NOT in v1 (nice to have later)
Water estimates · AI Efficiency Score · Personal AI Profile · AI Receipts · notifications · model benchmarking · Gemini/Perplexity · Firefox/Edge/Safari · enterprise/team dashboards · public API · social/sharing.

### Explicitly impossible or too risky to assume
Native-app / voice / embedded-AI coverage · accurate token counts (esp. reasoning/tool/system tokens) · exact per-prompt emissions · single-number precision · proprietary methodology as a moat · ToS tolerance from providers · a founder-supervised build without dedicated engineering ownership · stable third-party DOMs.

---

## The three lists, consolidated

### Must build for MVP
MV3 extension (Chrome) · ChatGPT + Claude adapters behind a common interface · remote config + kill switch + health telemetry · service worker with immediate persistence · local compute-and-discard privacy path · metadata-only allowlist sync · managed auth · validated/rate-limited ingest API · versioned server-side estimation (energy, ranges, confidence) · Postgres with RLS, no content columns, versioned estimates · Next.js dashboard with usage overview + one transparent energy insight · pause/export/delete.

### Nice to have (post-validation)
Gemini/Perplexity/Copilot/Grok adapters · Firefox/Edge/Safari · water + regional grid models · efficiency score, AI profile, receipts, notifications · model benchmarking · full local-only mode + third-party audit · enterprise dashboards · public API/SDK · warehouse + research aggregates · SOC 2/ISO.

### Impossible or risky assumptions to kill now
Reliable cross-platform tokens/model IDs · coverage of native apps/voice/embedded AI · exact emissions · single-number credibility · proprietary-methodology moat · provider ToS tolerance and usage APIs · stable DOMs · shipping without day-one engineering ownership · "we never read your conversations" as literally stated.

---

## Bottom line

The MVP is **buildable in weeks and maintainable only with permanent engineering commitment.** The code is the easy part; the data quality, the methodology credibility, and the scraper maintenance are the product. Build small, instrument for breakage, plumb confidence everywhere, adopt an open methodology, and secure real engineering ownership *before* the first line of code — not after the company "grows."
