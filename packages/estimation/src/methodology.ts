/**
 * Carbon Canvas estimation methodology — version e-0.1.0-prototype
 *
 * This module is the versioned, auditable heart of the estimation engine.
 * Every number here is an ASSUMPTION with a cited source and an uncertainty
 * band. The engine never emits a single value — always a low/high range —
 * and bands multiply through the pipeline so uncertainty compounds honestly.
 *
 * Approach follows published bottom-up inference-energy modeling
 * (EcoLogits-style: tokens → active-parameter compute → GPU energy → PUE),
 * deliberately NOT an invented framework. Values are prototype placeholders
 * within ranges reported by the cited public literature and MUST be
 * re-reviewed before any public exposure (PRD NFR-9).
 */

export const METHODOLOGY_VERSION = "e-0.1.0-prototype";

export interface ResearchSourceRef {
  id: string;
  title: string;
  org: string;
  year: number;
  url: string;
  category: "model-energy" | "datacenter" | "grid" | "tokenization";
  note: string;
}

/** Sources behind the assumption table (seeded to the research DB in Phase 5). */
export const SOURCES: ResearchSourceRef[] = [
  {
    id: "src-ecologits",
    title: "EcoLogits: Evaluating the Environmental Impacts of Generative AI",
    org: "GenAI Impact (open source)",
    year: 2024,
    url: "https://ecologits.ai",
    category: "model-energy",
    note: "Bottom-up methodology this engine's pipeline shape follows (tokens → compute → energy → PUE).",
  },
  {
    id: "src-luccioni",
    title: "Power Hungry Processing: Watts Driving the Cost of AI Deployment?",
    org: "Luccioni, Jernite, Strubell (FAccT)",
    year: 2024,
    url: "https://doi.org/10.1145/3630106.3658542",
    category: "model-energy",
    note: "Measured per-inference energy across model classes; anchors our per-token Wh bands.",
  },
  {
    id: "src-epoch",
    title: "How much energy does ChatGPT use?",
    org: "Epoch AI",
    year: 2025,
    url: "https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use",
    category: "model-energy",
    note: "Independent estimate (~0.3 Wh per typical chat query); sanity anchor for chat-class bands.",
  },
  {
    id: "src-uptime-pue",
    title: "Global Data Center Survey (average PUE)",
    org: "Uptime Institute",
    year: 2024,
    url: "https://uptimeinstitute.com/resources/research-and-reports",
    category: "datacenter",
    note: "Industry-average PUE ≈ 1.5–1.6; hyperscalers report ~1.1–1.2. We use 1.1–1.6 as the band.",
  },
  {
    id: "src-token-heuristic",
    title: "Tokenizer documentation (≈4 characters per token, English)",
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
 * Device-level energy bands per model class.
 * Deliberately wide: closed-model inference efficiency is not public
 * (batching, MoE, caching, hardware mix all unknown). Bands bracket the
 * range implied by the cited measurements and estimates.
 */
export const ENERGY_BANDS: Record<ModelClass, EnergyBand> = {
  light:     { whPer1kTokensLow: 0.05, whPer1kTokensHigh: 0.4,  sourceIds: ["src-luccioni", "src-ecologits"] },
  standard:  { whPer1kTokensLow: 0.2,  whPer1kTokensHigh: 1.2,  sourceIds: ["src-luccioni", "src-epoch", "src-ecologits"] },
  reasoning: { whPer1kTokensLow: 0.5,  whPer1kTokensHigh: 4.0,  sourceIds: ["src-epoch", "src-ecologits"] },
  unknown:   { whPer1kTokensLow: 0.1,  whPer1kTokensHigh: 2.0,  sourceIds: ["src-luccioni", "src-epoch"] },
};

/** Datacenter overhead (PUE) band. */
export const PUE_BAND = { low: 1.1, high: 1.6, sourceIds: ["src-uptime-pue"] };

/** Fallback when no token estimate exists: assume tokens per turn.
 *  Conservative band spanning short Q&A to long-form turns. */
export const TOKENS_PER_TURN_BAND = { low: 150, high: 900 };

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
      key: "Energy per 1k tokens (standard models)",
      value: `${ENERGY_BANDS.standard.whPer1kTokensLow}–${ENERGY_BANDS.standard.whPer1kTokensHigh} Wh`,
      rationale:
        "Closed-model inference efficiency is not public; band brackets measured open-model results and independent estimates for chat-class models.",
      sourceIds: ENERGY_BANDS.standard.sourceIds,
    },
    {
      key: "Energy per 1k tokens (reasoning models)",
      value: `${ENERGY_BANDS.reasoning.whPer1kTokensLow}–${ENERGY_BANDS.reasoning.whPer1kTokensHigh} Wh`,
      rationale:
        "Reasoning models generate hidden thinking tokens invisible to the client; the wider band reflects that unobservable extra compute.",
      sourceIds: ENERGY_BANDS.reasoning.sourceIds,
    },
    {
      key: "Datacenter overhead (PUE)",
      value: `${PUE_BAND.low}–${PUE_BAND.high}×`,
      rationale:
        "Provider datacenter is unknown; band spans hyperscaler-reported (~1.1) to industry-average (~1.6) PUE.",
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
  ];
}
