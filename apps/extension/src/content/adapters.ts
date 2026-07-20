/**
 * Platform adapters — the isolation layer for third-party DOM fragility
 * (Engineering Blueprint §3.2). Each adapter is selector-driven; selectors
 * are ordered fallbacks and can be overridden by remote config so a DOM
 * change is fixed by pushing JSON, not shipping a new extension build.
 */

import type { PlatformId, ConfidenceLevel } from "../shared/types";
import { estimateTokensFromNodes } from "./privacy";

export interface AdapterSelectors {
  enabled: boolean;
  /** All conversation turns (user + assistant). */
  turnSelectors: string[];
  /** User-authored turns (for turn counting sanity). */
  userTurnSelectors: string[];
  /** Element whose text names the active model, if the UI exposes one. */
  modelSelectors: string[];
}

/**
 * Baked-in defaults; remote config (worker → content) overrides these.
 * Selectors WILL rot — that is expected and survivable, not exceptional.
 * When all selectors miss, the adapter degrades to session-only tracking
 * (platform + duration) instead of emitting garbage.
 */
export const DEFAULT_SELECTORS: Record<PlatformId, AdapterSelectors> = {
  chatgpt: {
    enabled: true,
    turnSelectors: [
      "[data-message-author-role]",
      "article[data-testid^='conversation-turn']",
    ],
    userTurnSelectors: ["[data-message-author-role='user']"],
    modelSelectors: [
      "[data-testid='model-switcher-dropdown-button']",
      "button[aria-label*='Model selector']",
    ],
  },
  claude: {
    enabled: true,
    turnSelectors: ["[data-testid='user-message'], [data-is-streaming], .font-claude-message"],
    userTurnSelectors: ["[data-testid='user-message']"],
    modelSelectors: [
      "[data-testid='model-selector-dropdown']",
      "button[aria-haspopup='menu'] .whitespace-nowrap",
    ],
  },
};

export function detectPlatform(hostname: string): PlatformId | null {
  if (hostname === "chatgpt.com" || hostname === "chat.openai.com") return "chatgpt";
  if (hostname === "claude.ai") return "claude";
  return null;
}

function queryFirst(selectors: string[]): Element | null {
  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel);
      if (el) return el;
    } catch {
      /* invalid selector from config — skip */
    }
  }
  return null;
}

function queryAllFirst(selectors: string[]): Element[] {
  for (const sel of selectors) {
    try {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) return Array.from(els);
    } catch {
      /* skip */
    }
  }
  return [];
}

export interface PageObservation {
  turnCount: number;
  estTokens: number | null;
  tokenConfidence: ConfidenceLevel;
  model: string | null;
  /** True when turn selectors matched nothing — health signal for drift. */
  selectorsMissed: boolean;
}

/** Observe the current page state. Reads text ONLY via the privacy module;
 *  returns numbers and short identifier strings only. */
export function observePage(selectors: AdapterSelectors): PageObservation {
  const turns = queryAllFirst(selectors.turnSelectors);
  const userTurns = queryAllFirst(selectors.userTurnSelectors);

  // Turn count: prefer user turns (a "prompt count"); fall back to half the
  // total turns; never negative.
  const turnCount =
    userTurns.length > 0 ? userTurns.length : Math.ceil(turns.length / 2);

  // Token estimate from visible text length (privacy module discards text).
  // Long chats virtualize old messages out of the DOM, so this undercounts —
  // hence confidence is never better than "medium".
  const estTokens = turns.length > 0 ? estimateTokensFromNodes(turns) : null;
  const tokenConfidence: ConfidenceLevel = estTokens === null ? "low" : "medium";

  // Model name: short UI label only, truncated defensively.
  const modelEl = queryFirst(selectors.modelSelectors);
  const modelRaw = modelEl?.textContent?.trim() ?? null;
  const model = modelRaw ? modelRaw.slice(0, 60) : null;

  return {
    turnCount,
    estTokens,
    tokenConfidence,
    model,
    selectorsMissed: turns.length === 0,
  };
}
