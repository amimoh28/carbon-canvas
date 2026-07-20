import { describe, it, expect } from "vitest";
import {
  estimateSessionEnergy,
  aggregateEstimates,
  humanComparison,
  classifyModel,
  METHODOLOGY_VERSION,
} from "../src/index";

describe("classifyModel", () => {
  it("maps null to unknown", () => {
    expect(classifyModel(null)).toBe("unknown");
  });
  it("maps light models", () => {
    expect(classifyModel("Claude Haiku")).toBe("light");
    expect(classifyModel("gpt-4o-mini")).toBe("light");
  });
  it("maps reasoning models", () => {
    expect(classifyModel("o3")).toBe("reasoning");
    expect(classifyModel("Claude Opus")).toBe("reasoning");
  });
  it("maps standard chat models", () => {
    expect(classifyModel("Claude Sonnet 4")).toBe("standard");
    expect(classifyModel("GPT-4o")).toBe("standard");
  });
  it("keeps garbage unknown", () => {
    expect(classifyModel("mystery-9000")).toBe("unknown");
  });
});

describe("estimateSessionEnergy", () => {
  const base = {
    platform: "claude",
    model: "Claude Sonnet 4",
    turnCount: 10,
    estTokens: 8000,
    tokenConfidence: "medium" as const,
  };

  it("always returns a range, never a point", () => {
    const e = estimateSessionEnergy(base);
    expect(e.energyWhLow).toBeGreaterThan(0);
    expect(e.energyWhHigh).toBeGreaterThan(e.energyWhLow);
  });

  it("stamps the methodology version and stores exact inputs", () => {
    const e = estimateSessionEnergy(base);
    expect(e.methodologyVersion).toBe(METHODOLOGY_VERSION);
    expect(e.inputs.estTokens).toBe(8000);
    expect(e.inputs.pueLow).toBeDefined();
  });

  it("is deterministic", () => {
    expect(estimateSessionEnergy(base)).toEqual(estimateSessionEnergy(base));
  });

  it("unknown model → wider relative band and lower confidence than known model", () => {
    const known = estimateSessionEnergy(base);
    const unknown = estimateSessionEnergy({ ...base, model: null });
    expect(unknown.confidenceScore).toBeLessThan(known.confidenceScore);
    const knownRatio = known.energyWhHigh / known.energyWhLow;
    const unknownRatio = unknown.energyWhHigh / unknown.energyWhLow;
    expect(unknownRatio).toBeGreaterThan(knownRatio);
  });

  it("missing tokens falls back to turn-count band and lowers confidence", () => {
    const noTokens = estimateSessionEnergy({ ...base, estTokens: null });
    expect(noTokens.energyWhLow).toBeGreaterThan(0);
    expect(noTokens.confidenceScore).toBeLessThan(
      estimateSessionEnergy(base).confidenceScore,
    );
    expect(noTokens.reasons.some((r) => !r.ok && r.label.includes("turn count"))).toBe(true);
  });

  it("never reaches high confidence (region/hardware always unknown)", () => {
    const best = estimateSessionEnergy({
      platform: "claude",
      model: "Claude Sonnet 4",
      turnCount: 50,
      estTokens: 50_000,
      tokenConfidence: "high",
    });
    expect(best.confidence).not.toBe("high");
    expect(best.reasons.some((r) => !r.ok)).toBe(true); // always at least one honest caveat
  });

  it("empty session collapses to near-zero with low confidence", () => {
    const e = estimateSessionEnergy({
      platform: "chatgpt",
      model: null,
      turnCount: 0,
      estTokens: null,
      tokenConfidence: "low",
    });
    expect(e.energyWhHigh).toBe(0);
    expect(e.confidence).toBe("low");
  });

  it("reasoning class carries the hidden-tokens caveat", () => {
    const e = estimateSessionEnergy({ ...base, model: "Claude Opus" });
    expect(e.reasons.some((r) => r.label.includes("reasoning tokens"))).toBe(true);
  });

  it("reasoning class is capped at low confidence (v0.2.0 research review)", () => {
    const e = estimateSessionEnergy({
      platform: "chatgpt",
      model: "o3",
      turnCount: 40,
      estTokens: 30_000,
      tokenConfidence: "high",
    });
    expect(e.modelClass).toBe("reasoning");
    expect(e.confidence).toBe("low");
  });
});

describe("aggregateEstimates", () => {
  it("sums ranges and averages confidence", () => {
    const a = estimateSessionEnergy({
      platform: "claude", model: "Claude Sonnet 4",
      turnCount: 5, estTokens: 4000, tokenConfidence: "medium",
    });
    const total = aggregateEstimates([a, a]);
    expect(total.energyWhLow).toBeCloseTo(a.energyWhLow * 2, 2);
    expect(total.energyWhHigh).toBeCloseTo(a.energyWhHigh * 2, 2);
  });
  it("handles the empty case", () => {
    const total = aggregateEstimates([]);
    expect(total.energyWhLow).toBe(0);
    expect(total.confidence).toBe("low");
  });
});

describe("humanComparison", () => {
  it("stays calm and honest at small magnitudes", () => {
    expect(humanComparison(0.1, 0.5)).toMatch(/LED bulb/);
  });
  it("scales to phone charges", () => {
    expect(humanComparison(10, 20)).toMatch(/phone charge/);
    expect(humanComparison(100, 200)).toMatch(/phone charges/);
  });
});
