/**
 * Content script: detects the platform, observes activity with a debounced
 * MutationObserver, and reports metadata-only messages to the worker.
 * Silent by design (UX §2.5) — it must never interfere with the user's work.
 */

import { detectPlatform, observePage, DEFAULT_SELECTORS, type AdapterSelectors } from "./adapters";
import type { ContentMessage, PlatformId } from "../shared/types";

const platform = detectPlatform(location.hostname);

if (platform) {
  let selectors: AdapterSelectors = DEFAULT_SELECTORS[platform];
  let debounceTimer: number | undefined;
  let lastSignature = "";

  const report = (p: PlatformId) => {
    if (!selectors.enabled) return; // kill switch: observe nothing, emit nothing
    const obs = observePage(selectors);
    // Only message the worker when something actually changed.
    const signature = `${obs.turnCount}|${obs.estTokens}|${obs.model}`;
    if (signature === lastSignature) return;
    lastSignature = signature;
    const msg: ContentMessage = {
      kind: "activity",
      platform: p,
      model: obs.model,
      turnCount: obs.turnCount,
      estTokens: obs.estTokens,
      tokenConfidence: obs.tokenConfidence,
    };
    chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
  };

  // Ask the worker for remote-config selector overrides (kill switch included).
  chrome.runtime.sendMessage({ kind: "get-config", platform }, (cfg?: AdapterSelectors) => {
    if (chrome.runtime.lastError) return; // worker asleep — defaults are fine
    if (cfg) selectors = cfg;
    if (selectors.enabled) report(platform);
  });

  const observer = new MutationObserver(() => {
    // Debounced: AI pages mutate constantly while streaming; we sample calmly.
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => report(platform), 1500) as unknown as number;
  });
  observer.observe(document.body, { childList: true, subtree: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      const msg: ContentMessage = { kind: "page-hidden", platform };
      chrome.runtime.sendMessage(msg, () => void chrome.runtime.lastError);
    } else {
      report(platform);
    }
  });

  // Initial observation once the page settles.
  setTimeout(() => report(platform), 2500);
}
