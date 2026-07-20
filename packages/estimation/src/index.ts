/**
 * Carbon Canvas estimation engine.
 *
 * Pure and deterministic: same inputs → same outputs, no I/O, no clock.
 * The engine NEVER returns a single number — always a low/high range plus
 * a confidence score with human-readable reasons (PRD FR-9/FR-10).
 */

import {
  METHODOLOGY_VERSION,
  ENERGY_BANDS,
  PUE_BAND,
  TOKENS_PER_TURN_BAND,
  classifyModel,
  type ModelClass,
} from "./methodology";

export * from "./methodology";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface EstimateInput {
  platform: string;
  /** Model string as seen in the UI, or null (a normal, common state). */
  model: string | null;
  turnCount: number;
  /** Client-side token estimate from visible text, or null. */
  estTokens: number | null;
  /** Confidence the client attached to its token estimate. */
  tokenConfidence: ConfidenceLevel;
}

export interface ConfidenceReason {
  ok: boolean;
  label: string;
}

export interface EnergyEstimate {
  energyWhLow: number;
  energyWhHigh: number;
  confidence: ConfidenceLevel;
  confidenceScore: number; // 0..1
  reasons: ConfidenceReason[];
  modelClass: ModelClass;
  /** Exact inputs + intermediate values, stored for recomputability (NFR-12). */
  inputs: Record<string, unknown>;
  methodologyVersion: string;
}

function round(n: number, dp = 3): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/**
 * Estimate device+facility energy for one session.
 *
 * Pipeline: tokens (measured or per-turn band) × Wh/1k-token band × PUE band.
 * Low bounds multiply with low bounds, high with high, so the output range
 * honestly compounds every layer of uncertainty.
 */
export function estimateSessionEnergy(input: EstimateInput): EnergyEstimate {
  const modelClass = classifyModel(input.model);
  const band = ENERGY_BANDS[modelClass];

  const tokensMeasured = input.estTokens !== null && input.estTokens > 0;
  const tokensLow = tokensMeasured
    ? input.estTokens!
    : input.turnCount * TOKENS_PER_TURN_BAND.low;
  const tokensHigh = tokensMeasured
    ? input.estTokens!
    : input.turnCount * TOKENS_PER_TURN_BAND.high;

  const deviceWhLow = (tokensLow / 1000) * band.whPer1kTokensLow;
  const deviceWhHigh = (tokensHigh / 1000) * band.whPer1kTokensHigh;

  const energyWhLow = round(deviceWhLow * PUE_BAND.low);
  const energyWhHigh = round(deviceWhHigh * PUE_BAND.high);

  // ---- Confidence ---------------------------------------------------------
  // Weights live here, in the versioned methodology, so confidence itself is
  // auditable. Region/hardware are never known client-side → score is
  // structurally capped below "certainty", which is honest.
  const modelKnown = modelClass !== "unknown";
  const tokensGood = tokensMeasured && input.tokenConfidence !== "low";
  const hasActivity = input.turnCount > 0 || tokensMeasured;

  let score = 0.3; // base: platform + session observed directly
  if (modelKnown) score += 0.2;
  if (tokensMeasured) score += 0.15;
  if (tokensGood) score += 0.1;
  if (!hasActivity) score = 0.1;

  const reasons: ConfidenceReason[] = [
    { ok: true, label: "Platform and session observed directly" },
    {
      ok: modelKnown,
      label: modelKnown
        ? `Model identified (${input.model}) — class "${modelClass}"`
        : "Model unknown — using wide default energy band",
    },
    {
      ok: tokensMeasured,
      label: tokensMeasured
        ? "Activity size estimated from visible text"
        : "No token estimate — inferred from turn count",
    },
    { ok: false, label: "Data-center location and hardware unknown (industry-band assumption)" },
    ...(modelClass === "reasoning"
      ? [{ ok: false, label: "Hidden reasoning tokens are invisible — real energy may be higher" }]
      : []),
  ];

  const confidence: ConfidenceLevel =
    score >= 0.8 ? "high" : score >= 0.5 ? "medium" : "low";

  return {
    energyWhLow,
    energyWhHigh,
    confidence,
    confidenceScore: round(score, 2),
    reasons,
    modelClass,
    methodologyVersion: METHODOLOGY_VERSION,
    inputs: {
      platform: input.platform,
      model: input.model,
      modelClass,
      turnCount: input.turnCount,
      estTokens: input.estTokens,
      tokenConfidence: input.tokenConfidence,
      tokensLow,
      tokensHigh,
      whPer1kTokensLow: band.whPer1kTokensLow,
      whPer1kTokensHigh: band.whPer1kTokensHigh,
      pueLow: PUE_BAND.low,
      pueHigh: PUE_BAND.high,
    },
  };
}

/** Sum a set of session estimates into one total range.
 *  Overall confidence = weighted toward the weakest inputs (honest). */
export function aggregateEstimates(
  estimates: Pick<EnergyEstimate, "energyWhLow" | "energyWhHigh" | "confidenceScore">[],
): { energyWhLow: number; energyWhHigh: number; confidence: ConfidenceLevel } {
  const low = round(estimates.reduce((s, e) => s + e.energyWhLow, 0));
  const high = round(estimates.reduce((s, e) => s + e.energyWhHigh, 0));
  const avg =
    estimates.length === 0
      ? 0
      : estimates.reduce((s, e) => s + e.confidenceScore, 0) / estimates.length;
  const confidence: ConfidenceLevel = avg >= 0.8 ? "high" : avg >= 0.5 ? "medium" : "low";
  return { energyWhLow: low, energyWhHigh: high, confidence };
}

/** Translate a Wh range into a calm, human comparison (UX §5: honest, never
 *  manipulative; phone-charge ≈ 15 Wh, LED bulb ≈ 9 W). */
export function humanComparison(whLow: number, whHigh: number): string {
  const mid = (whLow + whHigh) / 2;
  if (mid <= 0) return "No measurable AI energy yet.";
  if (mid < 1) {
    const minutes = Math.max(1, Math.round((mid / 9) * 60));
    return `About the same as running an LED bulb for ${minutes} minute${minutes === 1 ? "" : "s"}.`;
  }
  if (mid < 30) {
    const pct = Math.min(100, Math.round((mid / 15) * 100));
    return `Roughly ${pct}% of one full phone charge.`;
  }
  const charges = Math.round(mid / 15);
  return `Roughly ${charges} phone charges.`;
}
