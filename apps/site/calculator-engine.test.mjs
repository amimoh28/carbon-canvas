import test from "node:test";
import assert from "node:assert/strict";
import {
  CalculatorInputError,
  buildCopyText,
  calculateScenario,
  formatEnergyRange,
} from "./calculator-engine.mjs";

const DEFAULT = Object.freeze({
  scope: "individual",
  messagesPerDay: 20,
  daysPerWeek: 5,
  use: "everyday",
});

test("uses exact fixed-point arithmetic for the default scenario", () => {
  const result = calculateScenario(DEFAULT);
  assert.equal(result.monthlyMessages, 433);
  assert.equal(result.energyWhLow, 69.28);
  assert.equal(result.energyWhHigh, 822.7);
});

test("cohort mode scales the entire range and message count", () => {
  const individual = calculateScenario(DEFAULT);
  const cohort = calculateScenario({ ...DEFAULT, scope: "cohort", participants: 30 });
  assert.equal(cohort.monthlyMessages, individual.monthlyMessages * 30);
  assert.equal(cohort.energyWhLow, individual.energyWhLow * 30);
  assert.equal(cohort.energyWhHigh, individual.energyWhHigh * 30);
  assert.equal(cohort.confidence.level, "low");
});

test("rejects negative, exponential, fractional, empty and oversized values", () => {
  for (const invalid of ["-1", "1e2", "2.5", "", "999999999999999999999"]) {
    assert.throws(
      () => calculateScenario({ ...DEFAULT, messagesPerDay: invalid }),
      CalculatorInputError,
    );
  }
});

test("rejects invalid enum values instead of propagating undefined or NaN", () => {
  assert.throws(() => calculateScenario({ ...DEFAULT, use: "<script>" }), CalculatorInputError);
  assert.throws(() => calculateScenario({ ...DEFAULT, scope: "company" }), CalculatorInputError);
});

test("maximum supported cohort remains finite", () => {
  const result = calculateScenario({
    scope: "cohort",
    messagesPerDay: 200,
    daysPerWeek: 7,
    use: "deep",
    participants: 10_000,
  });
  assert.ok(Number.isFinite(result.energyWhHigh));
  assert.ok(result.energyWhHigh > result.energyWhLow);
  assert.match(formatEnergyRange(result.energyWhLow, result.energyWhHigh), /MWh/);
});

test("is deterministic and does not mutate input", () => {
  const input = { ...DEFAULT };
  const before = structuredClone(input);
  assert.deepEqual(calculateScenario(input), calculateScenario(input));
  assert.deepEqual(input, before);
});

test("copy text includes caveats and methodology", () => {
  const text = buildCopyText(calculateScenario(DEFAULT));
  assert.match(text, /Scenario estimate only/);
  assert.match(text, /Methodology: e-0\.2\.0/);
});
