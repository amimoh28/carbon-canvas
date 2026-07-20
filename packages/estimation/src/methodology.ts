/**
 * Carbon Canvas estimation methodology — version e-0.2.0-prototype
 *
 * This module is the versioned, auditable heart of the estimation engine.
 * Every number here is an ASSUMPTION with a cited source and an uncertainty
 * band. The engine never emits a single value — always a low/high range —
 * and bands multiply through the pipeline so uncertainty compounds honestly.
 *
 * v0.2.0 (July 2026): bands and sources refreshed against the research
 * review in RESEARCH_REVIEW.md (live-verified July 2026). Key changes:
 * boundary disclosure added (device × PUE; host/idle not separately
 * counted), PUE low bound to 1.09 (Google fleet, 2025), standard band
 * low to 0.15 (Google 0.24 Wh/median-prompt comprehensive measurement),
 * light band widened down (nano-class benchmarks), reasoning band tuned
 * so its post-PUE ceiling reproduces the highest published long-prompt
 * estimates (o3 ≈ 39 Wh at ~10k tokens), reasoning confidence capped at
 * "low", carbon/water factors stored for research but still not displayed.
 *
 * Approach follows published bottom-up inference-energy modeling
 * (EcoLogits-style: tokens → active-parameter compute → GPU energy → PUE),
 * deliberately NOT an invented framework. Bands MUST be re-reviewed
 * quarterly (efficiency moved 33x in one year at one provider) and before
 * any public exposure (PRD NFR-9).
 */

export const METHODOLOGY_VERSION = "e-0.2.0-prototype";
export const METHODOLOGY_LAST_REVIEWED = "2026-07";

export interface ResearchSourceRef {
  id: string;
  title: string;
  org: string;
  year: number;
  url: string;
  category:
    | "model-energy"
    | "datacenter"
    | "grid"
    | "water"
    | "hardware"
    | "tokenization"
    | "lca";
  note: string;
}

/** Sources behind the assumption table (seeded to the research DB). */
export const SOURCES: ResearchSourceRef[] = [
  {
    id: "src-google-2025",
    title: "Measuring the environmental impact of delivering AI at Google Scale",
    org: "Google / DeepMind (arXiv:2508.15734)",
    year: 2025,
    url: "https://arxiv.org/abs/2508.15734",
    category: "model-energy",
    note: "Direct fleet measurement: median Gemini text prompt 0.24 Wh (comprehensive boundary: TPU + host + idle + PUE), 0.10 Wh narrow boundary, 0.26 mL onsite water, 33x efficiency gain in one year. Anchors our standard-band low end and the boundary disclosure.",
  },
  {
    id: "src-epoch",
    title: "How much energy does ChatGPT use?",
    org: "Epoch AI",
    year: 2025,
    url: "https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use",
    category: "model-energy",
    note: "Bottom-up estimate: ~0.3 Wh typical GPT-4o query; 0.0001-0.002 Wh per output token. Independent method converging with provider measurement.",
  },
  {
    id: "src-luccioni",
    title: "Power Hungry Processing: Watts Driving the Cost of AI Deployment?",
    org: "Luccioni, Jernite, Strubell (FAccT)",
    year: 2024,
    url: "https://doi.org/10.1145/3630106.3658542",
    category: "model-energy",
    note: "Measured open-model inference on controlled hardware; text generation ~0.05 Wh mean per query, task-dependent. The measured floor of our bands.",
  },
  {
    id: "src-how-hungry",
    title: "How Hungry is AI? Benchmarking Energy, Water, and Carbon Footprint of LLM Inference",
    org: "Jegham et al. (arXiv:2505.09598)",
    year: 2025,
    url: "https://arxiv.org/abs/2505.09598",
    category: "model-energy",
    note: "Inferred (not measured) estimates for 30 closed models: reasoning models o3 ~39 Wh and DeepSeek-R1 ~34 Wh per long prompt vs 0.45 Wh for nano-class. Methodologically contested; used as the upper-bound anchor for the reasoning band, at low confidence.",
  },
  {
    id: "src-ai-energy-score",
    title: "AI Energy Score — standardized model energy benchmark",
    org: "Hugging Face / Salesforce",
    year: 2025,
    url: "https://huggingface.co/AIEnergyScore",
    category: "model-energy",
    note: "Reproducible measured benchmark protocol for open models; cross-check for band placement per model class.",
  },
  {
    id: "src-mistral-lca",
    title: "Environmental life-cycle assessment of Mistral Large 2 / Le Chat",
    org: "Mistral AI with Carbone 4 & ADEME",
    year: 2025,
    url: "https://mistral.ai/news/our-contribution-to-a-global-environmental-standard-for-ai",
    category: "lca",
    note: "First provider LCA: ~1.14 gCO2e and ~45 mL water per 400-token response at the widest boundary (includes training amortization + embodied). Shows how much boundary choice moves numbers.",
  },
  {
    id: "src-uptime-2025",
    title: "Global Data Center Survey 2025 (15th annual)",
    org: "Uptime Institute",
    year: 2025,
    url: "https://uptimeinstitute.com/resources/research-and-reports/uptime-institute-global-data-center-survey-results-2025",
    category: "datacenter",
    note: "Industry weighted-average PUE 1.54, flat six consecutive years. High bound of our PUE band.",
  },
  {
    id: "src-google-pue",
    title: "Data center efficiency (fleet PUE disclosure)",
    org: "Google",
    year: 2025,
    url: "https://datacenters.google/efficiency/",
    category: "datacenter",
    note: "Fleet trailing-twelve-month PUE 1.09, per-site published. Low bound of our PUE band; frontier inference skews toward hyperscaler facilities.",
  },
  {
    id: "src-iea-2025",
    title: "Electricity 2025 — Emissions",
    org: "International Energy Agency",
    year: 2025,
    url: "https://www.iea.org/reports/electricity-2025/emissions",
    category: "grid",
    note: "Global average grid intensity ~445 gCO2/kWh (2024), trending to ~400 by 2027. Stored for the deferred carbon layer.",
  },
  {
    id: "src-ember-2025",
    title: "Yearly Electricity Data (2025 release)",
    org: "Ember",
    year: 2025,
    url: "https://ember-energy.org/data/yearly-electricity-data/",
    category: "grid",
    note: "Open per-country location-based factors (France ~41, US ~350, coal-heavy grids 600-700 gCO2/kWh). The ~17x regional spread with unknowable routing is why carbon display stays deferred.",
  },
  {
    id: "src-li-water",
    title: "Making AI Less Thirsty: Uncovering and Addressing the Secret Water Footprint of AI",
    org: "Li, Yang, Islam, Ren (UC Riverside)",
    year: 2023,
    url: "https://arxiv.org/abs/2304.03271",
    category: "water",
    note: "Foundational onsite + off-site water methodology; ~10-50 mL per GPT-3-era response including generation water vs Google's 0.26 mL onsite-only. The ~100x boundary spread keeps water display deferred.",
  },
  {
    id: "src-nvidia-specs",
    title: "H100 / H200 / B200 accelerator specifications",
    org: "NVIDIA",
    year: 2024,
    url: "https://www.nvidia.com/en-us/data-center/h100/",
    category: "hardware",
    note: "TDP anchors (H100 700 W; B200 ~1,000-1,200 W). Real draw is 40-80% of TDP and per-token efficiency improves 2-5x per generation; hardware is absorbed into model-class bands because serving hardware is unobservable.",
  },
  {
    id: "src-token-heuristic",
    title: "Tokenizer documentation (~4 characters per token, English)",
    org: "OpenAI / Anthropic developer docs",
    year: 2024,
    url: "https://platform.openai.com/tokenizer",
    category: "tokenization",
    note: "Basis for the chars/4 token estimate used when only visible text length is known.",
  },
];

/** Model classes — estimation buckets when the exact model is unknown or
 *  when per-model data does not exist (i.e., almost always). */
export type ModelClass = "light" | "standard" | "reasoning" | "unknown";

export interface EnergyBand {
  /** Wh per 1,000 tokens (input+output blended), device-level (pre-PUE). */
  whPer1kTokensLow: number;
  whPer1kTokensHigh: number;
  sourceIds: string[];
}

/**
 * Device-level energy bands per model class (v0.2.0, reviewed 2026-07).
 * Deliberately wide: closed-model inference efficiency is not public
 * (batching, MoE, caching, hardware mix all unknown). Bands bracket the
 * measured + estimated evidence; see RESEARCH_REVIEW.md §1.
 */
export const ENERGY_BANDS: Record<ModelClass, EnergyBand> = {
  light: {
    whPer1kTokensLow: 0.03,
    whPer1kTokensHigh: 0.3,
    sourceIds: ["src-luccioni", "src-how-hungry", "src-ai-energy-score"],
  },
  standard: {
    whPer1kTokensLow: 0.15,
    whPer1kTokensHigh: 1.2,
    sourceIds: ["src-google-2025", "src-epoch", "src-luccioni", "src-ai-energy-score"],
  },
  reasoning: {
    whPer1kTokensLow: 0.4,
    whPer1kTokensHigh: 3.5,
    sourceIds: ["src-how-hungry", "src-epoch"],
  },
  unknown: {
    whPer1kTokensLow: 0.1,
    whPer1kTokensHigh: 2.0,
    sourceIds: ["src-luccioni", "src-epoch", "src-google-2025"],
  },
};

/** Datacenter overhead (PUE) band: best published hyperscaler fleet →
 *  industry average (which facility serves a request is unknowable). */
export const PUE_BAND = { low: 1.09, high: 1.6, sourceIds: ["src-google-pue", "src-uptime-2025"] };

/** Fallback when no token estimate exists: assume tokens per turn.
 *  Conservative band spanning short Q&A to long-form turns. */
export const TOKENS_PER_TURN_BAND = { low: 150, high: 900 };

/**
 * Reference factors for the DEFERRED carbon and water layers. Stored so the
 * research DB and methodology page can disclose them; NOT used in any
 * user-facing estimate yet (routing unknown spans ~17x for carbon; boundary
 * disputes span ~100x for water — see RESEARCH_REVIEW.md §3-4).
 */
export const DEFERRED_FACTORS = {
  gridCarbonG_per_kWh: { low: 41, typicalUS: 350, globalAvg: 445, high: 700, sourceIds: ["src-ember-2025", "src-iea-2025"] },
  waterOnsiteL_per_kWh: { low: 0.02, high: 1.9, sourceIds: ["src-li-water", "src-google-2025"] },
  waterOffsiteL_per_kWh: { low: 1.0, high: 5.0, sourceIds: ["src-li-water"] },
};

/** Map a raw model string (from the page, may be null) to a class.
 *  Pattern rules are intentionally conservative; unknown stays unknown. */
export function classifyModel(model: string | null): ModelClass {
  if (!model) return "unknown";
  const m = model.toLowerCase();
  if (/(haiku|mini|nano|flash|lite|instant)/.test(m)) return "light";
  if (/(o[13](\b|-)|reasoning|thinking|opus|pro\b|deep)/.test(m)) return "reasoning";
  if (/(gpt|claude|sonnet|gemini|llama|mistral)/.test(m)) return "standard";
  return "unknown";
}

export interface AssumptionRecord {
  key: string;
  value: string;
  rationale: string;
  sourceIds: string[];
}

/** Human-readable assumption table for the transparency layer. */
export function listAssumptions(): AssumptionRecord[] {
  return [
    {
      key: "Measurement boundary",
      value: "device energy × PUE",
      rationale:
        "Host CPU/DRAM and idle-reserve overhead are not separately counted. Google's fleet measurement shows the comprehensive boundary is ~2.4× the narrow one (0.24 vs 0.10 Wh per median prompt), so our estimates may undercount by up to ~2× at the low end — stated rather than hidden.",
      sourceIds: ["src-google-2025"],
    },
    {
      key: "Energy per 1k tokens (standard models)",
      value: `${ENERGY_BANDS.standard.whPer1kTokensLow}–${ENERGY_BANDS.standard.whPer1kTokensHigh} Wh`,
      rationale:
        "Three independent methods converge on ~0.2–0.4 Wh for a median chat interaction (provider fleet measurement, third-party estimate, academic benchmark); band brackets that evidence with headroom for unfavorable batching.",
      sourceIds: ENERGY_BANDS.standard.sourceIds,
    },
    {
      key: "Energy per 1k tokens (light models)",
      value: `${ENERGY_BANDS.light.whPer1kTokensLow}–${ENERGY_BANDS.light.whPer1kTokensHigh} Wh`,
      rationale:
        "Nano/mini-class models measure ~70× below frontier reasoning models in the same benchmark; low bound follows measured open-model floors.",
      sourceIds: ENERGY_BANDS.light.sourceIds,
    },
    {
      key: "Energy per 1k tokens (reasoning models)",
      value: `${ENERGY_BANDS.reasoning.whPer1kTokensLow}–${ENERGY_BANDS.reasoning.whPer1kTokensHigh} Wh`,
      rationale:
        "Reasoning models generate hidden thinking tokens invisible to the client; upper anchor reproduces the highest published long-prompt estimates (o3 ≈ 39 Wh at ~10k tokens, post-PUE). Those estimates are inferred and contested, so this class is capped at low confidence.",
      sourceIds: ENERGY_BANDS.reasoning.sourceIds,
    },
    {
      key: "Datacenter overhead (PUE)",
      value: `${PUE_BAND.low}–${PUE_BAND.high}×`,
      rationale:
        "Provider datacenter is unknown; band spans the best published hyperscaler fleet (Google 1.09) to the six-years-flat industry average (Uptime 1.54, rounded up).",
      sourceIds: PUE_BAND.sourceIds,
    },
    {
      key: "Tokens per turn (when unmeasured)",
      value: `${TOKENS_PER_TURN_BAND.low}–${TOKENS_PER_TURN_BAND.high}`,
      rationale: "Used only when no visible-text token estimate exists; spans short Q&A to long-form turns.",
      sourceIds: ["src-token-heuristic"],
    },
    {
      key: "Token estimate from visible text",
      value: "≈ characters ÷ 4",
      rationale:
        "Standard English-text heuristic. Cannot see hidden reasoning, system, or tool tokens — so real totals may be higher; confidence is capped accordingly.",
      sourceIds: ["src-token-heuristic"],
    },
    {
      key: "Carbon display: deferred",
      value: `grid factors stored (${DEFERRED_FACTORS.gridCarbonG_per_kWh.low}–${DEFERRED_FACTORS.gridCarbonG_per_kWh.high} gCO₂/kWh)`,
      rationale:
        "Which region served a prompt is unknowable and spans a ~17× intensity range; the market-based vs location-based accounting dispute is unresolved. Factors live in the research DB; no per-prompt carbon number is shown until this can be done honestly.",
      sourceIds: DEFERRED_FACTORS.gridCarbonG_per_kWh.sourceIds,
    },
    {
      key: "Water display: deferred",
      value: `WUE stored (onsite ${DEFERRED_FACTORS.waterOnsiteL_per_kWh.low}–${DEFERRED_FACTORS.waterOnsiteL_per_kWh.high}, off-site ${DEFERRED_FACTORS.waterOffsiteL_per_kWh.low}–${DEFERRED_FACTORS.waterOffsiteL_per_kWh.high} L/kWh)`,
      rationale:
        "Published per-prompt water figures differ ~100× purely on boundary (onsite-only 0.26 mL vs full-cycle 10–50 mL). No agreed reporting standard exists; deferring is the honest choice.",
      sourceIds: [...DEFERRED_FACTORS.waterOnsiteL_per_kWh.sourceIds],
    },
    {
      key: "Review cadence",
      value: `quarterly (last: ${METHODOLOGY_LAST_REVIEWED})`,
      rationale:
        "One provider published a 33× per-prompt efficiency improvement in a single year — static numbers decay in months, so band staleness is itself a confidence input.",
      sourceIds: ["src-google-2025"],
    },
  ];
}
