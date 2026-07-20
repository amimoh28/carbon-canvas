# Carbon Canvas — MVP Development Plan

**Author:** Founding team (product founder + future CTO)
**Inputs:** Master Product Document v1.0; Product Strategy Review; Technical Feasibility Assessment (all in this repo)
**Operating assumptions:** One product-focused founder (non-technical), one technical CTO joining, limited startup resources.
**Governing principle:** *Validate demand before overbuilding.* We spend the least money that buys the most learning, and we do not write the extension until we have evidence someone wants it.

---

## 0. The one-paragraph plan

Before building anything, run a **4–6 week validation sprint** (landing-page tests + interviews + a manual "concierge" pilot) that costs almost nothing and answers the only question that matters: *does anyone want this, and framed as what?* Only if that passes do we build a **deliberately tiny extension** (Chrome, ChatGPT + Claude, session metadata, one honest energy insight) over ~10–12 weeks, instrumented to detect its own breakage. Then a **closed beta of 50–150 users** tells us whether people come back. Everything in the Master Document beyond that is deferred until these gates pass.

**Three gates, in order. Do not skip forward.**
```
GATE 1 — Demand        GATE 2 — Buildable data     GATE 3 — Retention
(weeks 1–6)            (spike, weeks 5–7)          (beta, weeks ~18–24)
"Do they want it?"     "Can we get the data?"      "Do they come back?"
   │ pass                  │ pass                      │ pass
   ▼                       ▼                           ▼
 build MVP             commit to platforms         raise / expand scope
```

---

## 1. MVP definition

### What the MVP is
> A Chrome extension that automatically tracks a user's **ChatGPT and Claude** session activity (privacy-preserving metadata only) and a simple web dashboard that shows their AI usage over time plus **one honest, methodology-transparent energy estimate.**

### The single hypothesis it tests
**"People who use AI heavily will install a passive tracker, return to it, and find an honest view of their usage valuable."**

If that is true, everything else in the Master Document becomes worth building. If it is false, no amount of features fixes it — so we test it with the smallest possible surface.

### What the MVP is deliberately NOT (v1 exclusions)
Water estimates · carbon estimate (defer until energy survives review — see Feasibility §7) · AI Efficiency Score · Personal AI Profile · AI Receipts · notifications · model benchmarking · Gemini/Perplexity · Firefox/Edge/Safari · enterprise/team features · public API · social/sharing · mobile.

### MVP success criteria (pre-committed — these decide iterate vs. pivot vs. stop)
| Metric | Target | Why |
|---|---|---|
| Beta installs completing onboarding | ≥ 100 | Enough signal to trust the rest |
| **Week-4 retention** | **≥ 25%** | The make-or-break number; curiosity is cheap, habit is not |
| Users who correctly explain an estimate | ≥ 40% | Transparency positioning must actually land |
| Uninstalls citing privacy/permissions | < 10% | The permission-prompt risk is real (Feasibility §1) |
| Data-capture reliability (sessions correctly logged) | ≥ 80% | Below this the product is lying to users |

*The exact numbers matter less than having thresholds committed in advance so ambiguous results can't be rationalized.*

---

## 2. User journey

### The MVP happy path
```
1. DISCOVER   Landing page → "See how you use AI, privately." → join / install
2. INSTALL    Chrome Web Store → add extension → clear, honest permission explainer
3. ONBOARD    30-sec setup: what we track, what we NEVER touch, create account (or local-only)
4. USE AI     User does what they already do in ChatGPT / Claude — extension is silent
5. FIRST VALUE Popup shows "Today: 3 sessions, ~22 min on ChatGPT + Claude"
6. RETURN     Dashboard: usage trend + platform split + ONE energy insight w/ "how was this calculated?"
7. TRUST      Every number links to methodology, sources, confidence, and a delete button
8. HABIT      A weekly reason to return (the retention question we're testing)
```

### The two moments that make or break it
- **The permission moment (step 2–3).** Chrome will warn "read your data on chatgpt.com, claude.ai." We must pre-empt it with a plain-language explainer *before* the browser prompt, or we lose the privacy-conscious user we most want. This is a UX problem, not a technical one, and it deserves real design time.
- **The return moment (step 6).** First value is easy (novelty). The *reason to come back next week* is the entire experiment. If the honest answer to "why return?" is weak, we have found the product's core flaw cheaply — which is the point.

### The journey we are NOT building yet
Notifications, receipts, efficiency scores, profiles, sharing — all are "reasons to return" candidates, but we test the simplest version first and add a return-driver only if base retention is borderline.

---

## 3. Feature priority list

Using MoSCoW, scoped to the MVP. "Must" = the experiment is invalid without it.

### Must have (MVP)
- Chrome MV3 extension with **ChatGPT + Claude** adapters (behind a common interface)
- Passive session detection: platform, duration, turn count, model-if-visible
- Local compute-and-discard of any text; **metadata-only** sync
- Popup: today's activity + dashboard link
- Account (managed auth) **or local-only mode**
- Dashboard: usage overview + trend + platform split
- **One** energy insight with ranges + confidence + "how was this calculated?"
- Privacy controls: pause, export, delete-all
- **Remote config + kill switch + health telemetry** (breakage is a *when*, not an *if* — Feasibility §10)

### Should have (fast-follow, only if base retention is weak)
- Weekly email/summary (a candidate return-driver)
- Model-breakdown view · basic session history

### Could have (post-validation)
- Carbon estimate (once energy survives external review) · AI Receipts · notifications

### Won't have (this phase)
- Water · efficiency score · profile · benchmarking · Gemini/Perplexity · other browsers · enterprise · public API · social/mobile

**Prioritization rule:** anything that doesn't directly serve *install → return → trust* is out. Every deferred feature stays in the Master Document's roadmap; none is cancelled, just sequenced.

---

## 4. Technical milestones

Each milestone has a clear "done" definition and a gate it feeds.

| M | Milestone | Done when… | Gate |
|---|---|---|---|
| **M0** | Validation sprint (no code) | Landing tests + interviews + concierge pilot complete, decision made | **Gate 1: Demand** |
| **M1** | Data-extraction spike | We can reliably read platform/turns/model/est-tokens from ChatGPT + Claude *and know the error bars* | **Gate 2: Buildable data** |
| **M2** | Extension skeleton | MV3 loads, detects both platforms, logs metadata to local storage, discards text | — |
| **M3** | Backend + auth + ingest | Authenticated, validated, rate-limited metadata ingest into Postgres w/ RLS | — |
| **M4** | Estimation service v0 | Deterministic energy pipeline, ranges + confidence + methodology_version, published assumptions | — |
| **M5** | Dashboard v1 | Usage overview + trend + one energy insight + full transparency panel | — |
| **M6** | Privacy + resilience | Pause/export/delete work; remote config + kill switch + health telemetry live; CI guard blocks content leakage | — |
| **M7** | Closed beta build | Onboarding polished, permission explainer tested, store listing ready | — |
| **M8** | Beta + measure | 100+ onboarded, 4 weeks of retention data collected | **Gate 3: Retention** |

**M1 is the technical crux.** If the spike shows we *cannot* reliably get model/token data or that error bars are absurd, that reshapes the product (e.g., session-only, no energy number) before we've spent the build budget. Run it in parallel with the tail of the validation sprint.

---

## 5. Development timeline

Realistic for a two-person team (founder on product/design/research, CTO on engineering), limited resources. Ranges, not promises — the Feasibility doc's whole point is that third-party fragility makes precise dates dishonest.

```
Weeks 1–6    │ M0  Validation sprint (founder-led)   ── GATE 1 ──
Weeks 5–7    │ M1  Data-extraction spike (CTO, overlaps M0)  ── GATE 2 ──
Weeks 7–9    │ M2  Extension skeleton
Weeks 8–11   │ M3  Backend + auth + ingest (overlaps M2)
Weeks 10–12  │ M4  Estimation service v0
Weeks 11–14  │ M5  Dashboard v1
Weeks 14–16  │ M6  Privacy + resilience hardening
Weeks 16–18  │ M7  Closed-beta build + store submission
Weeks 18–24  │ M8  Closed beta (min 4 wks retention data)  ── GATE 3 ──
```

- **~6 weeks to Gate 1** (mostly founder time, near-zero cash).
- **~18 weeks to a beta in users' hands.**
- **~24 weeks to a retention verdict.**
- **Chrome Web Store review latency** (days, sometimes longer) is a real dependency at M7 — submit early, budget slack.
- **Buffer everything:** first extension approval, selector breakage mid-beta, and methodology review will each eat time. If resources are tighter, cut *platforms and features*, never the *validation gates*.

---

## 6. Recommended tech stack

Endorsing the Master Document's choices — they're proven, cheap, and let a tiny team move fast. "Boring on purpose" is correct.

| Layer | Choice | Rationale |
|---|---|---|
| Extension | **Manifest V3 + TypeScript** | Required standard; type safety across a fragile codebase |
| Frontend | **Next.js + TypeScript + Tailwind + shadcn/ui + Recharts** | Fast, accessible, great charts; matches doc |
| Auth | **Clerk** (or Supabase Auth) | Buy it — never build auth |
| Backend | **Next.js API routes** (start monolithic) | No microservices at MVP scale |
| DB | **Postgres via Supabase, Prisma ORM, RLS on** | Managed, cheap, row-level isolation |
| Hosting | **Vercel** (web) + **Supabase** (data) | Low-ops, generous free/low tiers |
| Estimation methodology | **Adopt open framework** (EcoLogits / GSF SCI / academic) | Credibility > invention (Feasibility §7) |
| Resilience | **Remote config + health telemetry + kill switch** | Breakage management is core, not optional |
| Dev hygiene | GitHub, ESLint/Prettier, Dependabot, CI content-leak guard | Small team, high-trust product |

**Deliberately excluded at MVP:** microservices, Kafka/queues, data warehouse, GraphQL, Kubernetes, mobile frameworks. Add only when a real user need forces it.

---

## 7. First prototype requirements

Two prototypes, because we validate demand before building software. Do **P0 first**; only build **P1** if Gate 1 passes.

### P0 — Validation prototype (weeks 1–6, no product code)
The cheapest artifacts that produce real demand signal:
1. **Two landing pages**, A/B testing framing — *sustainability* ("Understand your AI's footprint") vs. *self-knowledge/productivity* ("See how you actually use AI"). Measure email-signup conversion. Resolves the identity conflict from the Strategy Review with data, not opinion.
2. **A waitlist** with a one-question survey ("what would make this useful to you?").
3. **20–30 problem interviews** with target users (AI-heavy students / professionals / founders).
4. **Concierge pilot:** for ~10 volunteers, the founder *manually* produces a weekly "AI usage + rough energy" report from their own screenshots/exports. Then watch whether they ask for week two. This tests the *value of the insight* with zero engineering.

**Gate 1 pass criteria (set now):** e.g., ≥8% landing→waitlist conversion on the winning frame, ≥50% of interviewees recognize the problem unprompted, and ≥40% of concierge users request a second report. Adjust the numbers, but commit them before running.

### P1 — Technical prototype (only after Gate 1)
Internal/dogfood build, not public:
- MV3 extension detecting ChatGPT + Claude, logging metadata locally, text discarded.
- Minimal dashboard reading local/dev data: usage overview + one energy estimate with confidence.
- Goal: prove the pipeline end-to-end for *ourselves* and de-risk M1's findings before beta polish.

---

## 8. Beta testing strategy

### Structure
- **Closed beta, invite-only, 50–150 users.** Small enough to support personally, large enough for a retention signal.
- **Recruit from the validation sprint:** waitlist + interviewees + the communities in the Master Doc's launch plan (AI/dev/student/sustainability). Bias toward *heavy* AI users — they feel the problem and stress the scrapers hardest.
- **Staggered onboarding** (waves of ~20–30) so early breakage doesn't burn the whole cohort.

### What we measure
- **Quantitative:** install→onboard completion, week-1/2/4 retention, sessions correctly captured (reliability), dashboard revisits, uninstall reasons, permission drop-off.
- **Qualitative:** 10–15 follow-up interviews — "what did you expect / did you trust the numbers / why did (or didn't) you come back?"
- **Trust probe:** can users explain, in their words, what an estimate means and that we don't read conversations? (Directly tests the transparency + privacy positioning.)

### How we run it
- **Feedback loop:** in-app link + a small Discord/Slack; founder does the interviews, CTO triages bugs.
- **Breakage drill:** deliberately validate the kill switch + remote-config fix path *during* beta — treat the first real selector break as a rehearsal for the operating model, not just a fire.
- **Instrumentation is privacy-preserving too:** health/retention telemetry uses the same metadata-only discipline as the product.

### Beta exit decision (Gate 3)
- **Pass** (hits retention + reliability + trust bars): expand scope down the roadmap — add a return-driver, a second platform, then consider carbon estimate + raise.
- **Weak retention, strong interest:** add one return-driver (weekly summary / receipts) and re-test *before* broadening.
- **Fail** (low retention despite interest and working tech): the core hypothesis is wrong — pivot the value prop (e.g., productivity-first, or the identity axis the landing test favored) rather than adding features. Failing here, cheaply, is a successful experiment.

---

## Summary: the discipline this plan enforces

1. **No extension code until Gate 1 proves demand** (~6 weeks, near-zero cash).
2. **A data-extraction spike (M1) de-risks the technical crux** before the build budget is committed.
3. **A tiny MVP** — one browser, two platforms, one honest energy number — tests retention, the only question that matters.
4. **Breakage is designed for from day one** (adapters + remote config + kill switch + telemetry).
5. **Pre-committed gates and thresholds** make the pivot/stop decisions honest instead of hopeful.

Everything in the Master Document beyond this is real and worth building — *after* these three gates say the foundation is sound. The fastest path to that answer is the smallest product, not the biggest.
