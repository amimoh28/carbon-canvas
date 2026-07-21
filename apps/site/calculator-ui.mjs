import {
  CalculatorInputError,
  buildCopyText,
  calculateScenario,
  formatComparison,
  formatEnergyRange,
  formatWaterRange,
} from "./calculator-engine.mjs";

const PRESETS = Object.freeze({
  light: Object.freeze({ messagesPerDay: 5, daysPerWeek: "2", use: "quick" }),
  regular: Object.freeze({ messagesPerDay: 20, daysPerWeek: "5", use: "everyday" }),
  heavy: Object.freeze({ messagesPerDay: 80, daysPerWeek: "7", use: "deep" }),
});
const HISTORY_KEY = "carbon-canvas-calculator-history-v2";
const THEME_KEY = "carbon-canvas-theme";
const MAX_HISTORY = 8;

const elements = Object.freeze({
  formCard: document.getElementById("formCard"),
  resultCard: document.getElementById("resultCard"),
  scopeTabs: document.getElementById("scopeTabs"),
  presetTabs: document.getElementById("presetTabs"),
  cohortBox: document.getElementById("cohortBox"),
  participants: document.getElementById("participants"),
  participantsError: document.getElementById("participantsError"),
  messagesPerDay: document.getElementById("messagesPerDay"),
  messagesOutput: document.getElementById("messagesOutput"),
  daysPerWeek: document.getElementById("daysPerWeek"),
  useType: document.getElementById("useType"),
  errorBanner: document.getElementById("errorBanner"),
  errorMessage: document.getElementById("errorMessage"),
  energyRange: document.getElementById("energyRange"),
  headlineComparison: document.getElementById("headlineComparison"),
  confidenceText: document.getElementById("confidenceText"),
  methodVersion: document.getElementById("methodVersion"),
  summaryLine: document.getElementById("summaryLine"),
  comparisonGrid: document.getElementById("comparisonGrid"),
  waterRange: document.getElementById("waterRange"),
  saveButton: document.getElementById("saveButton"),
  copyButton: document.getElementById("copyButton"),
  resetButton: document.getElementById("resetButton"),
  historyTape: document.getElementById("historyTape"),
  clearHistoryButton: document.getElementById("clearHistoryButton"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  toast: document.getElementById("toast"),
  ctaTitle: document.getElementById("ctaTitle"),
  ctaText: document.getElementById("ctaText"),
  ctaLink: document.getElementById("ctaLink"),
});

let currentResult = null;
let toastTimer = 0;

function activeValue(container, dataKey) {
  const selected = container.querySelector('[aria-selected="true"]');
  return selected?.dataset[dataKey] ?? "";
}

function collectInput() {
  return {
    scope: activeValue(elements.scopeTabs, "scope"),
    messagesPerDay: elements.messagesPerDay.value,
    daysPerWeek: elements.daysPerWeek.value,
    use: elements.useType.value,
    participants: elements.participants.value,
  };
}

function setSelected(container, button) {
  container.querySelectorAll('[role="tab"]').forEach((item) => {
    const selected = item === button;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
}

function updateScopeUI(scope) {
  const cohort = scope === "cohort";
  elements.cohortBox.hidden = !cohort;
  elements.ctaTitle.textContent = cohort ? "Planning a voluntary higher-education pilot?" : "This is a scenario. Want automatic tracking?";
  elements.ctaText.textContent = cohort
    ? "Use a founding pilot to test participation, education and aggregate learning without employee or student surveillance."
    : "The Carbon Canvas extension is being prepared to estimate AI activity privately in your browser without reading conversations.";
  elements.ctaLink.textContent = cohort ? "Explore a founding pilot" : "Join the extension waitlist";
  elements.ctaLink.href = cohort ? "/higher-education#pilot" : "/waitlist";
}

function clearError() {
  elements.errorBanner.hidden = true;
  elements.errorMessage.textContent = "";
  elements.participants.removeAttribute("aria-invalid");
  elements.participantsError.textContent = "";
}

function showError(error) {
  const message = error instanceof CalculatorInputError ? error.message : "The scenario could not be calculated. Check your entries.";
  elements.errorMessage.textContent = message;
  elements.errorBanner.hidden = false;
  elements.formCard.classList.remove("shake");
  requestAnimationFrame(() => elements.formCard.classList.add("shake"));
  if (error instanceof CalculatorInputError && error.field === "participants") {
    elements.participants.setAttribute("aria-invalid", "true");
    elements.participantsError.textContent = message;
  }
}

function renderComparisons(result) {
  const fragment = document.createDocumentFragment();
  result.comparisons.forEach((comparison) => {
    const tile = document.createElement("div");
    tile.className = "comparison-tile";
    const icon = document.createElement("span");
    icon.className = "comparison-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = comparison.emoji;
    const number = document.createElement("span");
    number.className = "comparison-number";
    number.textContent = comparison.count.toLocaleString();
    const label = document.createElement("span");
    label.className = "comparison-label";
    label.textContent = comparison.count === 1 ? comparison.singular : comparison.plural;
    tile.append(icon, number, label);
    fragment.append(tile);
  });
  elements.comparisonGrid.replaceChildren(fragment);
}

function renderResult(result) {
  currentResult = result;
  elements.energyRange.textContent = formatEnergyRange(result.energyWhLow, result.energyWhHigh);
  elements.headlineComparison.textContent = formatComparison(result.headlineComparison);
  elements.confidenceText.textContent = `${result.confidence.level.replace(/^./, (character) => character.toUpperCase())} confidence`;
  elements.methodVersion.textContent = `Method ${result.methodologyVersion}`;
  elements.waterRange.textContent = formatWaterRange(result.waterLitresLow, result.waterLitresHigh);
  const roundedMessages = Math.round(result.monthlyMessages).toLocaleString();
  elements.summaryLine.textContent = result.input.scope === "cohort"
    ? `Based on about ${roundedMessages} messages a month across ${result.input.participants.toLocaleString()} voluntary participants (${result.note} per participant).`
    : `Based on about ${roundedMessages} messages a month (${result.note}).`;
  renderComparisons(result);
}

function calculateAndRender() {
  elements.messagesOutput.value = elements.messagesPerDay.value;
  clearError();
  try {
    const result = calculateScenario(collectInput());
    renderResult(result);
    return result;
  } catch (error) {
    currentResult = null;
    showError(error);
    return null;
  }
}

function syncPresetSelection() {
  const matchingKey = Object.entries(PRESETS).find(([, preset]) =>
    String(preset.messagesPerDay) === elements.messagesPerDay.value &&
    preset.daysPerWeek === elements.daysPerWeek.value &&
    preset.use === elements.useType.value
  )?.[0];
  elements.presetTabs.querySelectorAll('[role="tab"]').forEach((button) => {
    const selected = button.dataset.preset === matchingKey;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
}

function pulse() {
  if (typeof navigator.vibrate === "function") navigator.vibrate(8);
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("show"), 1900);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("Copy failed");
}

function safeReadHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry) => entry && typeof entry === "object" && entry.input && typeof entry.savedAt === "string").slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

function writeHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)));
  } catch {
    showToast("History could not be saved in this browser");
  }
}

function scenarioDescription(input) {
  const scope = input.scope === "cohort" ? `${input.participants.toLocaleString()} people` : "Individual";
  return `${scope} · ${input.messagesPerDay}/day · ${input.daysPerWeek} days/week · ${input.use}`;
}

function renderHistory() {
  const history = safeReadHistory();
  elements.clearHistoryButton.hidden = history.length === 0;
  if (history.length === 0) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "Save a scenario to compare it later. History stays in this browser.";
    elements.historyTape.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  history.forEach((entry, index) => {
    let restored;
    try { restored = calculateScenario(entry.input); } catch { return; }
    const item = document.createElement("article");
    item.className = "history-item";
    const meta = document.createElement("div");
    meta.className = "history-meta";
    const label = document.createElement("span");
    label.textContent = entry.input.scope === "cohort" ? "Cohort" : "Individual";
    const time = document.createElement("time");
    time.dateTime = entry.savedAt;
    time.textContent = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(entry.savedAt));
    meta.append(label, time);
    const energy = document.createElement("div");
    energy.className = "history-energy";
    energy.textContent = formatEnergyRange(restored.energyWhLow, restored.energyWhHigh);
    const description = document.createElement("p");
    description.className = "history-description";
    description.textContent = scenarioDescription(restored.input);
    const actions = document.createElement("div");
    actions.className = "history-actions";
    const recall = document.createElement("button");
    recall.type = "button";
    recall.textContent = "Recall";
    recall.addEventListener("click", () => restoreScenario(restored.input));
    const copy = document.createElement("button");
    copy.type = "button";
    copy.textContent = "Copy";
    copy.addEventListener("click", async () => {
      try { await copyText(buildCopyText(restored)); showToast("Saved result copied"); pulse(); }
      catch { showToast("Copy was blocked by the browser"); }
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove saved scenario ${index + 1}`);
    remove.addEventListener("click", () => {
      const next = safeReadHistory();
      next.splice(index, 1);
      writeHistory(next);
      renderHistory();
    });
    actions.append(recall, copy, remove);
    item.append(meta, energy, description, actions);
    fragment.append(item);
  });
  elements.historyTape.replaceChildren(fragment);
}

function restoreScenario(input) {
  const scopeButton = elements.scopeTabs.querySelector(`[data-scope="${input.scope}"]`);
  if (scopeButton) setSelected(elements.scopeTabs, scopeButton);
  elements.messagesPerDay.value = String(input.messagesPerDay);
  elements.daysPerWeek.value = String(input.daysPerWeek);
  elements.useType.value = input.use;
  if (input.scope === "cohort") elements.participants.value = String(input.participants);
  updateScopeUI(input.scope);
  syncPresetSelection();
  calculateAndRender();
  elements.formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  showToast("Scenario recalled");
  pulse();
}

function resetScenario() {
  const individualButton = elements.scopeTabs.querySelector('[data-scope="individual"]');
  setSelected(elements.scopeTabs, individualButton);
  elements.messagesPerDay.value = "20";
  elements.daysPerWeek.value = "5";
  elements.useType.value = "everyday";
  elements.participants.value = "30";
  updateScopeUI("individual");
  syncPresetSelection();
  calculateAndRender();
  showToast("Calculator reset");
  pulse();
}

function bindRovingTabs(container, dataKey, onSelect) {
  container.addEventListener("click", (event) => {
    const button = event.target.closest('[role="tab"]');
    if (!button || !container.contains(button)) return;
    setSelected(container, button);
    onSelect(button.dataset[dataKey]);
    pulse();
  });
  container.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    const buttons = [...container.querySelectorAll('[role="tab"]')];
    const currentIndex = buttons.indexOf(document.activeElement);
    if (currentIndex < 0) return;
    event.preventDefault();
    let nextIndex = currentIndex;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = buttons.length - 1;
    else if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (currentIndex + 1) % buttons.length;
    else nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
    const next = buttons[nextIndex];
    next.focus();
    setSelected(container, next);
    onSelect(next.dataset[dataKey]);
  });
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  const dark = theme === "dark";
  elements.themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  elements.themeIcon.innerHTML = dark
    ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>'
    : '<path d="M20.5 15.4A8 8 0 0 1 8.6 3.5 8 8 0 1 0 20.5 15.4Z"/>';
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#111713" : "#f4f5ef");
}

bindRovingTabs(elements.scopeTabs, "scope", (scope) => {
  updateScopeUI(scope);
  calculateAndRender();
});
bindRovingTabs(elements.presetTabs, "preset", (presetKey) => {
  const preset = PRESETS[presetKey];
  elements.messagesPerDay.value = String(preset.messagesPerDay);
  elements.daysPerWeek.value = preset.daysPerWeek;
  elements.useType.value = preset.use;
  calculateAndRender();
});

elements.messagesPerDay.addEventListener("input", () => { syncPresetSelection(); calculateAndRender(); });
elements.daysPerWeek.addEventListener("change", () => { syncPresetSelection(); calculateAndRender(); });
elements.useType.addEventListener("change", () => { syncPresetSelection(); calculateAndRender(); });
elements.participants.addEventListener("input", calculateAndRender);

elements.saveButton.addEventListener("click", () => {
  const result = calculateAndRender();
  if (!result) return;
  const history = safeReadHistory();
  history.unshift({ input: result.input, savedAt: new Date().toISOString() });
  writeHistory(history);
  renderHistory();
  showToast("Scenario saved locally");
  pulse();
});

elements.copyButton.addEventListener("click", async () => {
  const result = currentResult ?? calculateAndRender();
  if (!result) return;
  try { await copyText(buildCopyText(result)); showToast("Result copied"); pulse(); }
  catch { showToast("Copy was blocked by the browser"); }
});

elements.resetButton.addEventListener("click", resetScenario);
elements.clearHistoryButton.addEventListener("click", () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  showToast("Saved scenarios cleared");
});

elements.themeToggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch {}
  pulse();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") clearError();
  if (event.key === "Enter" && event.target instanceof HTMLInputElement && event.target.type === "number") {
    event.preventDefault();
    calculateAndRender();
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "c" && document.activeElement === document.body && currentResult) {
    event.preventDefault();
    copyText(buildCopyText(currentResult)).then(() => showToast("Result copied")).catch(() => showToast("Copy was blocked"));
  }
});

const preferredTheme = (() => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
})();
applyTheme(preferredTheme);

const requestedScope = new URLSearchParams(location.search).get("scope");
if (requestedScope === "cohort") {
  const cohortButton = elements.scopeTabs.querySelector('[data-scope="cohort"]');
  setSelected(elements.scopeTabs, cohortButton);
  updateScopeUI("cohort");
} else {
  updateScopeUI("individual");
}

calculateAndRender();
renderHistory();
