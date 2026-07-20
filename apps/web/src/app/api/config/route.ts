/**
 * GET /api/config — remote selector config for the extension.
 *
 * The breakage-fix fast path (Blueprint §1.2): when a platform redesign
 * breaks a selector, we update this config — no extension release, no store
 * review. Setting `enabled: false` is the kill switch: the adapter stops
 * emitting rather than reporting garbage.
 *
 * Prototype serves the defaults; production would back this with an
 * editable store + signing.
 */

import { NextResponse } from "next/server";

const CONFIG = {
  version: 1,
  adapters: {
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
      turnSelectors: [
        "[data-testid='user-message'], [data-is-streaming], .font-claude-message",
      ],
      userTurnSelectors: ["[data-testid='user-message']"],
      modelSelectors: [
        "[data-testid='model-selector-dropdown']",
        "button[aria-haspopup='menu'] .whitespace-nowrap",
      ],
    },
  },
};

export async function GET() {
  return NextResponse.json(CONFIG, {
    headers: { "Cache-Control": "public, max-age=300" },
  });
}
