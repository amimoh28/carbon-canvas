/**
 * Adapter tests against DOM fixtures (Blueprint §8.3: per-platform extraction
 * validated against saved snapshots). Fixtures mimic the real platforms'
 * relevant DOM shapes; when the real DOM drifts, refreshing these fixtures
 * is a routine maintenance task.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { observePage, detectPlatform, DEFAULT_SELECTORS } from "../src/content/adapters";
import { estimateTokensFromNodes } from "../src/content/privacy";

function setBody(html: string) {
  document.body.innerHTML = html;
}

describe("detectPlatform", () => {
  it("maps hostnames to platforms", () => {
    expect(detectPlatform("chatgpt.com")).toBe("chatgpt");
    expect(detectPlatform("chat.openai.com")).toBe("chatgpt");
    expect(detectPlatform("claude.ai")).toBe("claude");
    expect(detectPlatform("example.com")).toBeNull();
  });
});

describe("chatgpt adapter", () => {
  beforeEach(() => {
    // Fixture: simplified ChatGPT conversation DOM (role-attributed turns).
    setBody(`
      <div data-testid="model-switcher-dropdown-button">GPT-4o</div>
      <div data-message-author-role="user">${"How do photosynthesis work? ".repeat(4)}</div>
      <div data-message-author-role="assistant">${"Photosynthesis converts light energy... ".repeat(40)}</div>
      <div data-message-author-role="user">${"Thanks, and in the dark? ".repeat(2)}</div>
      <div data-message-author-role="assistant">${"At night plants respire... ".repeat(30)}</div>
    `);
  });

  it("counts user turns as the prompt count", () => {
    const obs = observePage(DEFAULT_SELECTORS.chatgpt);
    expect(obs.turnCount).toBe(2);
    expect(obs.selectorsMissed).toBe(false);
  });

  it("estimates tokens from visible text with medium confidence", () => {
    const obs = observePage(DEFAULT_SELECTORS.chatgpt);
    expect(obs.estTokens).toBeGreaterThan(100);
    expect(obs.tokenConfidence).toBe("medium");
  });

  it("reads the model label", () => {
    const obs = observePage(DEFAULT_SELECTORS.chatgpt);
    expect(obs.model).toBe("GPT-4o");
  });
});

describe("claude adapter", () => {
  beforeEach(() => {
    setBody(`
      <button aria-haspopup="menu"><span class="whitespace-nowrap">Claude Sonnet 4</span></button>
      <div data-testid="user-message">${"Summarize this paper for me. ".repeat(3)}</div>
      <div class="font-claude-response">${"The paper argues... ".repeat(50)}</div>
    `);
  });

  it("extracts turns, tokens, and model", () => {
    const obs = observePage(DEFAULT_SELECTORS.claude);
    expect(obs.turnCount).toBe(1);
    expect(obs.estTokens).toBeGreaterThan(50);
    expect(obs.model).toContain("Claude");
  });
});

describe("selector drift (the expected failure mode)", () => {
  it("degrades honestly when nothing matches — no garbage emitted", () => {
    setBody(`<main><div class="totally-new-redesign">hello</div></main>`);
    const obs = observePage(DEFAULT_SELECTORS.chatgpt);
    expect(obs.selectorsMissed).toBe(true);
    expect(obs.turnCount).toBe(0);
    expect(obs.estTokens).toBeNull();
    expect(obs.tokenConfidence).toBe("low");
  });
});

describe("privacy boundary", () => {
  it("estimateTokensFromNodes returns only a number", () => {
    setBody(`<div id="a">This is a private conversation about my health.</div>`);
    const nodes = [document.getElementById("a")!];
    const result = estimateTokensFromNodes(nodes);
    expect(typeof result).toBe("number");
    // ~47 chars / 4 ≈ 12
    expect(result).toBeGreaterThan(5);
    expect(result).toBeLessThan(30);
  });

  it("the sync payload shape has no field that can carry text", async () => {
    // Structural check on the schema package itself.
    const { sessionPayloadSchema } = await import("@carbon-canvas/schema");
    const keys = Object.keys((sessionPayloadSchema as any).shape);
    expect(keys.sort()).toEqual(
      [
        "clientEventId", "platform", "model", "startedAt", "endedAt",
        "durationSec", "turnCount", "estTokens", "tokenConfidence",
      ].sort(),
    );
    // .strict() → unknown fields (e.g. a smuggled "text") are rejected.
    const bad = sessionPayloadSchema.safeParse({
      clientEventId: "cc_test_12345",
      platform: "claude",
      model: null,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSec: 60,
      turnCount: 2,
      estTokens: 100,
      tokenConfidence: "medium",
      text: "smuggled conversation content",
    });
    expect(bad.success).toBe(false);
  });
});
