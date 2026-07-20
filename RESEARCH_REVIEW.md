# Carbon Canvas — AI Sustainability Research Review

**Role:** Senior research assistant, AI sustainability & life-cycle assessment
**Date:** July 2026 (sources verified via live search this month)
**Purpose:** Establish credible, transparent ranges for the five core metrics behind the Carbon Canvas estimation engine, per the founder's constraint: *"I would rather have low confidence in an honest estimate than high confidence in an inaccurate one."*
**Integration:** Findings below are encoded in methodology version `e-0.2.0-prototype` (packages/estimation) and seeded into the research database.

---

## How to read this review

Every metric gets: **(a)** the credible range and why it's a range, **(b)** the expert sources and their methodologies, **(c)** the variables that shift the range, **(d)** explicit no-consensus flags, and **(e)** what Carbon Canvas adopts and at what confidence.

One concept dominates everything and must be understood first:

> **The boundary problem.** Published numbers differ mostly because they measure different things, not because someone is wrong. A "per-prompt energy" figure may include: the accelerator only; accelerator + host CPU/DRAM; + idle reserve capacity; + datacenter overhead (PUE); + electricity-generation water/carbon upstream. Google's landmark 2025 paper showed this explicitly: the **same Gemini prompt** is ~0.10 Wh at the narrow boundary (active TPU only) and **0.24 Wh** at the comprehensive boundary (TPU + host + idle machines + PUE). Any tool that compares numbers across sources without stating boundaries is producing noise. Carbon Canvas states its boundary on every estimate: **device-level band × explicit PUE band**, with idle/host overhead acknowledged as an unquantified underestimate risk.

---

## 1. Energy per token / per prompt (inference)

### Credible range
- **Light/small models:** ~0.01–0.3 Wh per typical prompt (sub-0.5 Wh even for very long prompts on "nano"-class models).
- **Standard chat models:** **~0.1–1.2 Wh per typical prompt** — the strongest-evidence zone; three independent methods (provider measurement, third-party estimate, academic benchmark) converge on ~0.2–0.4 Wh for a median chat interaction.
- **Reasoning / long-context models:** ~1–40 Wh per heavy prompt. Reasoning chains multiply output tokens (visible and hidden); long-context prefill adds more.
- Per-token framing: ~**0.0001–0.002 Wh per output token** (Epoch AI), i.e. 0.1–2 Wh per 1,000 output tokens, before datacenter overhead.

### Key sources & methodologies
| Source | Method | Headline figure | Boundary |
|---|---|---|---|
| **Google, "Measuring the environmental impact of delivering AI at Google Scale" (arXiv:2508.15734, Aug 2025)** | Direct fleet measurement, production Gemini | **0.24 Wh median text prompt**; 33× efficiency gain May 2024→May 2025 | Comprehensive: TPU + host + idle + PUE (market-leading PUE ≈ 1.09) |
| **Epoch AI, "How much energy does ChatGPT use?" (Feb 2025)** | Bottom-up estimate: GPT-4o on H100 nodes, utilization assumptions | **~0.3 Wh per typical query**; 0.0001–0.002 Wh/output token | Device + utilization assumptions; explicitly labeled estimate |
| **Luccioni, Jernite & Strubell, "Power Hungry Processing" (FAccT 2024)** | Direct measurement, open models on controlled hardware | Text generation ≈ 0.05 Wh mean per query (task-dependent); image generation ~60× text | Device-level (GPU), measured |
| **Jegham et al., "How Hungry is AI?" (arXiv:2505.09598, 2025)** | Inferred from API latency/throughput + statistical hardware assumptions, 30 models | GPT-4.1-nano ≈ 0.45 Wh **long** prompt; **o3 ≈ 39 Wh, DeepSeek-R1 ≈ 34 Wh long prompts** | Estimated (not measured); includes infrastructure multipliers |
| **Sam Altman blog (June 2025)** | Provider statement, method undisclosed | "~0.34 Wh average ChatGPT query" | Undisclosed — treat as anecdote, not evidence |
| **AI Energy Score (Hugging Face / Salesforce, 2025)** | Standardized measured benchmark, open models | Per-model star ratings, GPU-energy per 1k queries | Device-level, reproducible protocol |
| **Mistral AI LCA (July 2025, with Carbone 4 / ADEME)** | Full life-cycle assessment, provider data | Le Chat (Large 2): ~1.14 gCO₂e & ~45 mL water per 400-token response | Full LCA incl. training amortization & embodied — widest boundary of any source |

### Variables that shift the range
**Model size/architecture** (MoE active-parameter fraction; nano vs frontier ≈ 70× spread in the same benchmark) · **reasoning mode** (hidden thinking tokens — the largest single multiplier, 10–70×) · **prompt/output length** (long-context prefill is quadratic-ish pre-optimization) · **batching & utilization** (fleet-level medians assume high batching; low-traffic models are far worse per query) · **hardware generation** (see §5) · **measured vs inferred methodology**.

### No-consensus flags 🚩
1. **Boundary inconsistency** (see top) — the field's biggest source of apparent disagreement.
2. **Median vs mean:** distributions are heavy-tailed; Google reports median. Means are likely 2–5× higher. No agreement on which to report.
3. **Closed-model opacity:** every closed-model number is either provider-reported (unauditable) or inferred (unverifiable). The "How Hungry is AI?" figures for o3/R1 are widely cited *and* methodologically contested — treat as upper-bound indicators, not measurements.
4. **Efficiency is a moving target:** Google's 33×-in-one-year improvement means any static number decays within months. Estimates must be versioned and dated (ours are).

### Carbon Canvas adopts (v e-0.2.0)
Device-level bands per model class, per 1k blended tokens: **light 0.03–0.3 Wh · standard 0.15–1.2 Wh · reasoning 0.4–3.5 Wh · unknown 0.1–2.0 Wh**, then × PUE band (§2). Bands bracket the measured/estimated evidence above; the reasoning band's post-PUE ceiling (≈5.6 Wh/1k tokens) reproduces the "How Hungry is AI?" o3 long-prompt figure at ~10k tokens. **Confidence: medium** for standard/light (three-method convergence), **low** for reasoning (hidden tokens unobservable) and unknown.

---

## 2. Datacenter overhead (PUE)

### Credible range
**1.09 (best hyperscaler fleet) – 1.6 (industry average).**

### Key sources
- **Uptime Institute Global Data Center Survey 2025** (15th annual, n≈800+ operators): industry weighted-average PUE **1.54 — flat for six consecutive years**. Methodology: operator self-report, annualized.
- **Google (2025):** fleet-wide trailing-twelve-month PUE **1.09**, per-site data published. **Microsoft Azure:** ~1.12–1.18 design PUE for new builds. **Meta:** ~1.09.
- Uptime Intelligence regional mapping: newer/larger/cooler-climate sites cluster 1.2–1.4; legacy and tropical sites 1.5–1.8+.

### Variables
Provider (hyperscaler vs colo vs legacy) · climate · cooling technology (liquid cooling for AI racks improves PUE but shifts burden to water, §4) · facility age · load factor.

### No-consensus flags 🚩
- PUE is **self-reported and unaudited**; definitions drift (annualized vs design vs instantaneous).
- Frontier AI inference runs disproportionately in **hyperscaler** facilities (PUE 1.1–1.2), so applying the 1.54 industry average to ChatGPT/Claude/Gemini likely **overestimates** — but which facilities serve a given request is unknowable from outside.

### Carbon Canvas adopts
**PUE band 1.09–1.6**, low bound = best published hyperscaler fleet, high bound = industry average (covers the unknown-routing case). **Confidence: medium** — the best-evidenced parameter in the whole pipeline, but unauditable.

---

## 3. Grid carbon intensity

### Credible range (location-based, generation)
**~30–700 gCO₂/kWh** across realistic AI-hosting regions:
- France ≈ **41** · Sweden/Norway ≈ 30–45 (Ember 2025 data)
- Global average ≈ **445** (IEA Electricity 2025, 2024 actual; falling toward ~400 by 2027)
- United States ≈ **350** · Poland/India/coal-heavy grids ≈ 600–700

### Key sources
- **IEA, Electricity 2025 (Emissions chapter)** — global and regional intensities, forecast methodology published.
- **Ember Yearly Electricity Data (2025 release)** — per-country factors, open data, consistent production-based methodology; the de-facto open standard.
- **Electricity Maps** — real-time and historical, flow-traced consumption-based intensities; used by cloud carbon tools.
- **Our World in Data** — lifecycle intensities (includes upstream methane etc., systematically higher than production-based).

### Variables
Country/region · **time of day and season** (a grid's intensity can swing 3× intraday) · production vs consumption accounting · generation-only vs lifecycle factors.

### No-consensus flags 🚩
1. **Market-based vs location-based accounting — the field's fiercest fight.** Providers buying renewable certificates/PPAs report near-zero market-based emissions (Google's 0.03 gCO₂e/prompt is market-based); critics argue only location-based reflects physical reality. GHG Protocol Scope 2 revision is actively contested.
2. **Request routing is invisible:** we cannot know which region served a prompt. This single unknown spans a ~17× intensity range and is why Carbon Canvas does not display carbon yet.

### Carbon Canvas adopts
Store Ember/IEA location-based factors in the research DB (done, v e-0.2.0) but **continue to defer carbon display**. If/when shown: location-based, defaulting to a US/global-average band (~350–480) with the routing unknown as an explicit low-confidence reason, and the market-based debate disclosed on the methodology page. **Confidence: high on the factors themselves; low on applying them to any specific prompt.**

---

## 4. Water usage

### Credible range
- **Onsite (cooling) WUE:** ~0.02 L/kWh (best sites, e.g. Microsoft Singapore) → ~1.9 L/kWh (industry average; Microsoft Arizona 1.52). Modern AI-DC target: <0.2–0.4.
- **Off-site (electricity generation) water:** ~1–5 L/kWh depending on grid mix — usually **larger than onsite**, and usually omitted from provider claims.
- **Per-prompt:** Google reports **0.26 mL/prompt (onsite only, best-in-class)**; Li et al. estimate **~10–50 mL per response** for GPT-3-era models when generation water is included. These are both "true" — different boundaries (see top).

### Key sources
- **Li, Yang, Islam & Ren, "Making AI Less Thirsty" (UC Riverside, 2023; updated)** — the foundational academic treatment; onsite + off-site methodology; GPT-3 ≈ 16.9 mL per 150–300-word response (2.2 onsite + 14.7 generation, US average).
- **Google (arXiv:2508.15734):** 0.26 mL median prompt, onsite, measured.
- **Uptime Institute / The Green Grid** — WUE metric definition and industry distributions; **IEEE Spectrum (2025)** — critical synthesis of boundary disputes.
- **Mistral LCA:** ~45 mL per 400-token response, full lifecycle (widest boundary).

### Variables
Cooling technology (evaporative vs air vs liquid-loop) · climate · **onsite vs off-site boundary** (~an order of magnitude) · grid mix (hydro/thermoelectric water intensity) · seasonal operation.

### No-consensus flags 🚩
- The 100× spread between Google's 0.26 mL and Li et al.'s upper estimates is **entirely boundary + vintage + efficiency**, and public discourse constantly compares them as if commensurate. No agreed reporting standard exists.
- Off-site water factors per grid are far less standardized than carbon factors.

### Carbon Canvas adopts
**Continue deferring water display** (as v0.1 did). Research DB now stores WUE bands (onsite 0.02–1.9 L/kWh; off-site 1–5 L/kWh) with the boundary disclosure. If ever shown: widest ranges in the product, lowest confidence tier, boundary stated inline. **Confidence: low.**

---

## 5. GPU / accelerator efficiency

### Credible range & sources
- **NVIDIA H100:** 700 W TDP (SXM); **H200:** ~700 W; **B200:** ~1,000–1,200 W; **GB200 NVL72** rack-scale ~120 kW (NVIDIA spec sheets — manufacturer-documented, high confidence *as specs*).
- **Per-token efficiency improves ~2–5× per generation** (vendor claims larger; independent benchmarks like MLPerf Inference and AI Energy Score show real but smaller gains).
- **Real-world utilization is the wild card:** production fleets run accelerators anywhere from ~10% to ~70% utilization; per-query energy scales inversely with batching efficiency. Epoch AI's and Google's analyses both hinge on utilization assumptions.
- **TPUs and custom silicon** (Google TPU v5e/v6, AWS Trainium/Inferentia) serve a large share of frontier inference with no public per-token energy specs at all.

### No-consensus flags 🚩
- TDP ≠ draw: actual inference draw is typically 40–80% of TDP, workload-dependent.
- Which hardware serves a given closed-model request is unknowable — H100 vs B200 vs TPU changes per-token energy ~2–4×.

### Carbon Canvas adopts
Hardware is **not** a user-visible parameter; it is absorbed into the per-model-class energy bands (§1), which is honest because we can never observe it. The research DB stores the spec anchors. Confidence reasons continue to state "hardware unknown."

---

## Cross-cutting recommendations (applied in v e-0.2.0)

1. **State the boundary on every estimate.** New assumption row: "Boundary: device energy × PUE; host/idle overhead not separately counted (may underestimate ~1.5–2× vs comprehensive measurement — Google 0.10 vs 0.24 Wh)."
2. **Bands updated** to the §1 values; every band cites its sources in the DB.
3. **Source list expanded** from 5 to 12 entries (Google 2025, How Hungry is AI, Li et al., IEA 2025, Ember 2025, Uptime 2025, AI Energy Score, Mistral LCA added), each tagged with method + boundary + confidence, per the Research Database schema.
4. **Confidence scoring adjusted:** reasoning-class estimates are now capped at **low** confidence (hidden tokens + contested sources), and a boundary caveat appears in every reason list. Region/hardware unknowns keep the ceiling below "high" — unchanged, and now better justified.
5. **Carbon and water stay deferred in the UI.** The factors are in the DB; the display gate is now an explicit, sourced decision (routing unknown spans 17× for carbon; boundary disputes span 100× for water) rather than a vague "later."
6. **Date-stamp and re-review:** efficiency moved 33× in one year at one provider. Bands carry a `lastReviewed` date and should be re-reviewed **quarterly** — staleness is itself a confidence input.

## Honest limitations of this review

Search-based verification (July 2026) confirmed the 2024–2025 landmark sources but cannot rule out newer 2026 publications that shift these ranges; the quarterly re-review exists for exactly that reason. All closed-model figures remain either unauditable (provider) or unverifiable (inferred) — the ranges are defensible, no point inside them is.

### Source index
Google/DeepMind arXiv:2508.15734 · Epoch AI Gradient Update (Feb 2025) · Luccioni et al. FAccT '24 (10.1145/3630106.3658542) · Jegham et al. arXiv:2505.09598 · AI Energy Score (HF/Salesforce) · Mistral AI LCA (Jul 2025) · Uptime Institute Global Survey 2025 · Google/Meta/Microsoft sustainability reports (PUE/WUE) · IEA Electricity 2025 · Ember Yearly Electricity Data 2025 · Electricity Maps · Li et al., "Making AI Less Thirsty" (2023) · The Green Grid WUE · NVIDIA H100/H200/B200 specifications · MLPerf Inference.
