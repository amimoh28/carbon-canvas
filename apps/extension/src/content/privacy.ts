/**
 * The privacy boundary of Carbon Canvas.
 *
 * This module is the ONLY place conversation text is ever touched. Functions
 * here accept DOM nodes, derive NUMBERS, and return numbers. Text never
 * escapes this module: it is not stored, not posted, not logged, not
 * returned. This is the structural enforcement of the product's core
 * promise (PRD FR-15): "read in-page to count, then discard."
 */

/** ≈4 characters per token (English heuristic, cited in methodology). */
const CHARS_PER_TOKEN = 4;

/**
 * Estimate tokens for a set of message elements from their visible text
 * length. Returns only an integer; the text itself never leaves this scope.
 */
export function estimateTokensFromNodes(nodes: Element[]): number {
  let chars = 0;
  for (const node of nodes) {
    // textContent is read into a local, counted, and released — never returned.
    const text = node.textContent;
    if (text) chars += text.length;
  }
  return Math.round(chars / CHARS_PER_TOKEN);
}
