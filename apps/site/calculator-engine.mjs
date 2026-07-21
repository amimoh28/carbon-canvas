/**
 * Carbon Canvas public scenario calculator engine.
 *
 * Pure, deterministic and DOM-free. All energy calculations use fixed-point
 * integer arithmetic (BigInt micro-watt-hours) so decimal bands and the 4.33
 * weeks/month factor do not accumulate binary floating-point error.
 */

export const CALCULATOR_METHODOLOGY_VERSION = "e-0.2.0";

const MICRO_WH_PER_WH = 1_000_000n;
const MONTH_FACTOR_NUMERATOR = 433n;
const MONTH_FACTOR_DENOMINATOR = 100n;

const USE_BANDS = Object.freeze({
  quick: Object.freeze({ lowMicroWh: 70_000n, highMicroWh: 800_000n, note: "short exchange" }),
  everyday: Object.freeze({ lowMicroWh: 160_000n, highMicroWh: 1_900_000n, note: "typical message" }),
  deep: Object.freeze({ lowMicroWh: 1_000_000n, highMicroWh: 14_000_000n, note: "long or reasoning-heavy task" }),
});

const WATER_MICROLITRES_PER_KWH = Object.freeze({ low: 200_000n, high: 7_000_000n });
const MICRO_WH_PER_KWH = 1_000_000_000n;

const LIMITS = Object.freeze({
  messagesPerDay: Object.freeze({ min: 1, max: 200 }),
  daysPerWeek: Object.freeze({ min: 1, max: 7 }),
  participants: Object.freeze({ min: 2, max: 10_000 }),
});

const ENERGY_REFERENCES_WH = Object.freeze([
  Object.freeze({ key: "search", emoji: "⌕", wh: 0.3, singular: "web search", plural: "web searches" }),
  Object.freeze({ key: "led", emoji: "✦", wh: 9, singular: "hour of an LED bulb", plural: "hours of an LED bulb" }),
  Object.freeze({ key: "phone", emoji: "▣", wh: 15, singular: "phone charge", plural: "phone charges" }),
  Object.freeze({ key: "laptop", emoji: "▱", wh: 50, singular: "hour on a laptop", plural: "hours on a laptop" }),
  Object.freeze({ key: "stream", emoji: "▶", wh: 75, singular: "hour of HD streaming", plural: "hours of HD streaming" }),
  Object.freeze({ key: "kettle", emoji: "≈", wh: 100, singular: "kettle boil", plural: "kettle boils" }),
  Object.freeze({ key: "laundry", emoji: "◎", wh: 700, singular: "warm load of laundry", plural: "warm loads of laundry" }),
  Object.freeze({ key: "fridge", emoji: "▤", wh: 1_000, singular: "fridge-day", plural: "fridge-days" }),
]);

export class CalculatorInputError extends Error {
  constructor(field, message, code = "INVALID_INPUT") {
    super(message);
    this.name = "CalculatorInputError";
    this.field = field;
    this.code = code;
  }
}

function parseBoundedInteger(value, field, { min, max }) {
  const normalized = typeof value === "number" ? String(value) : String(value ?? "").trim();
  if (!/^\d+$/.test(normalized)) {
    throw new CalculatorInputError(field, "Enter a whole number.");
  }

  const parsed = Number(normalized);
  if (!Number.isSafeInteger(parsed)) {
    throw new CalculatorInputError(field, "That number is too large.", "OUT_OF_RANGE");
  }
  if (parsed < min || parsed > max) {
    throw new CalculatorInputError(field, `Enter a value from ${min.toLocaleString()} to ${max.toLocaleString()}.`, "OUT_OF_RANGE");
  }
  return parsed;
}

function parseEnum(value, field, allowed) {
  const normalized = String(value ?? "");
  if (!allowed.includes(normalized)) {
    throw new CalculatorInputError(field, "Choose one of the available options.");
  }
  return normalized;
}

function divideRoundHalfUp(numerator, denominator) {
  if (denominator <= 0n) throw new RangeError("Denominator must be positive.");
  return (numerator + denominator / 2n) / denominator;
}

function microWhToWh(value) {
  const whole = value / MICRO_WH_PER_WH;
  const remainder = value % MICRO_WH_PER_WH;
  const result = Number(whole) + Number(remainder) / Number(MICRO_WH_PER_WH);
  if (!Number.isFinite(result) || !Number.isSafeInteger(Number(whole))) {
    throw new RangeError("Calculated energy exceeds the supported display range.");
  }
  return result;
}

function microLitresToLitres(value) {
  const whole = value / 1_000_000n;
  const remainder = value % 1_000_000n;
  return Number(whole) + Number(remainder) / 1_000_000;
}

function confidenceFor(use, scope) {
  if (use === "deep" || scope === "cohort") {
    return Object.freeze({ level: "low", score: 0.38 });
  }
  return Object.freeze({ level: "low–medium", score: 0.48 });
}

function selectComparisons(midWh) {
  const candidates = ENERGY_REFERENCES_WH.map((reference) => ({
    ...reference,
    count: midWh / reference.wh,
  }));
  const readable = candidates.filter(({ count }) => count >= 1 && count < 5_000);
  const source = readable.length >= 3 ? readable : candidates;

  return source
    .sort((a, b) => Math.abs(Math.log10(Math.max(a.count, 0.000001)) - 1) - Math.abs(Math.log10(Math.max(b.count, 0.000001)) - 1))
    .slice(0, 3)
    .map((item) => Object.freeze({
      key: item.key,
      emoji: item.emoji,
      count: Math.max(1, Math.round(item.count)),
      singular: item.singular,
      plural: item.plural,
    }));
}

function headlineComparison(midWh) {
  if (midWh < 300) {
    return { count: Math.max(1, Math.round(midWh / 15)), singular: "phone charge", plural: "phone charges", suffix: "spread across a month" };
  }
  if (midWh < 3_000) {
    return { count: Math.max(1, Math.round(midWh / 100)), singular: "kettle boil", plural: "kettle boils", suffix: "spread across a month" };
  }
  if (midWh < 20_000) {
    return { count: Math.max(1, Math.round(midWh / 700)), singular: "warm load of laundry", plural: "warm loads of laundry", suffix: "over a month" };
  }
  return { count: Math.max(1, Math.round(midWh / 1_000)), singular: "day of refrigerator use", plural: "days of refrigerator use", suffix: "in total" };
}

/**
 * Calculate a monthly individual or cohort scenario.
 * @param {{scope: 'individual'|'cohort', messagesPerDay: number|string, daysPerWeek: number|string, use: 'quick'|'everyday'|'deep', participants?: number|string}} rawInput
 */
export function calculateScenario(rawInput) {
  if (!rawInput || typeof rawInput !== "object") {
    throw new CalculatorInputError("form", "Enter a complete scenario.");
  }

  const scope = parseEnum(rawInput.scope, "scope", ["individual", "cohort"]);
  const use = parseEnum(rawInput.use, "use", Object.keys(USE_BANDS));
  const messagesPerDay = parseBoundedInteger(rawInput.messagesPerDay, "messagesPerDay", LIMITS.messagesPerDay);
  const daysPerWeek = parseBoundedInteger(rawInput.daysPerWeek, "daysPerWeek", LIMITS.daysPerWeek);
  const participants = scope === "cohort"
    ? parseBoundedInteger(rawInput.participants, "participants", LIMITS.participants)
    : 1;

  const band = USE_BANDS[use];
  const monthlyMessagesHundredths = BigInt(messagesPerDay) * BigInt(daysPerWeek) * BigInt(participants) * MONTH_FACTOR_NUMERATOR;
  const energyLowMicroWh = divideRoundHalfUp(monthlyMessagesHundredths * band.lowMicroWh, MONTH_FACTOR_DENOMINATOR);
  const energyHighMicroWh = divideRoundHalfUp(monthlyMessagesHundredths * band.highMicroWh, MONTH_FACTOR_DENOMINATOR);

  const energyWhLow = microWhToWh(energyLowMicroWh);
  const energyWhHigh = microWhToWh(energyHighMicroWh);
  const energyWhMid = (energyWhLow + energyWhHigh) / 2;

  const waterLowMicroLitres = divideRoundHalfUp(energyLowMicroWh * WATER_MICROLITRES_PER_KWH.low, MICRO_WH_PER_KWH);
  const waterHighMicroLitres = divideRoundHalfUp(energyHighMicroWh * WATER_MICROLITRES_PER_KWH.high, MICRO_WH_PER_KWH);
  const waterLitresLow = microLitresToLitres(waterLowMicroLitres);
  const waterLitresHigh = microLitresToLitres(waterHighMicroLitres);

  const monthlyMessages = Number(monthlyMessagesHundredths) / 100;
  const confidence = confidenceFor(use, scope);

  return Object.freeze({
    input: Object.freeze({ scope, use, messagesPerDay, daysPerWeek, participants }),
    monthlyMessages,
    energyWhLow,
    energyWhHigh,
    energyWhMid,
    waterLitresLow,
    waterLitresHigh,
    confidence,
    note: band.note,
    headlineComparison: Object.freeze(headlineComparison(energyWhMid)),
    comparisons: Object.freeze(selectComparisons(energyWhMid)),
    methodologyVersion: CALCULATOR_METHODOLOGY_VERSION,
  });
}

function decimalsFor(value) {
  if (value < 10) return 1;
  return 0;
}

function formatScaledRange(low, high, units) {
  const unit = units.find((candidate) => high >= candidate.threshold) ?? units.at(-1);
  const lowScaled = low / unit.divisor;
  const highScaled = high / unit.divisor;
  const maxFractionDigits = decimalsFor(highScaled);
  const formatter = new Intl.NumberFormat(undefined, { maximumFractionDigits: maxFractionDigits, minimumFractionDigits: maxFractionDigits });
  return `≈ ${formatter.format(lowScaled)}–${formatter.format(highScaled)} ${unit.label}`;
}

export function formatEnergyRange(lowWh, highWh) {
  return formatScaledRange(lowWh, highWh, [
    { threshold: 1_000_000, divisor: 1_000_000, label: "MWh" },
    { threshold: 1_000, divisor: 1_000, label: "kWh" },
    { threshold: 0, divisor: 1, label: "Wh" },
  ]);
}

export function formatWaterRange(lowLitres, highLitres) {
  const formatter = new Intl.NumberFormat(undefined, {
    maximumFractionDigits: highLitres < 10 ? 1 : 0,
    minimumFractionDigits: highLitres < 10 ? 1 : 0,
  });
  const low = lowLitres < 0.1 ? "<0.1" : formatter.format(lowLitres);
  const high = formatter.format(highLitres);
  return `≈ ${low}–${high} litres`;
}

export function formatComparison(comparison) {
  const unit = comparison.count === 1 ? comparison.singular : comparison.plural;
  return `About ${comparison.count.toLocaleString()} ${unit}, ${comparison.suffix}.`;
}

export function buildCopyText(result) {
  const scopeLabel = result.input.scope === "cohort"
    ? `${result.input.participants.toLocaleString()}-participant cohort`
    : "individual";
  return [
    "Carbon Canvas AI energy scenario",
    `${scopeLabel}; ${result.input.messagesPerDay} messages/day; ${result.input.daysPerWeek} days/week; ${result.input.use} use`,
    `Monthly energy: ${formatEnergyRange(result.energyWhLow, result.energyWhHigh)}`,
    `Rough water perspective: ${formatWaterRange(result.waterLitresLow, result.waterLitresHigh)}`,
    `Confidence: ${result.confidence.level}`,
    `Methodology: ${result.methodologyVersion}`,
    "Scenario estimate only—not measured usage or reporting-grade emissions data.",
  ].join("\n");
}
