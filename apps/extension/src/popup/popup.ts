/** Popup: today's glance + privacy controls (UX §2.2 priority order:
 *  1) is it working  2) today at a glance  3) dashboard  4) instant control. */

import type { ExtensionSettings, LocalSession } from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/types";

const PLATFORM_LABEL: Record<string, string> = { chatgpt: "ChatGPT", claude: "Claude" };

function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

async function load() {
  const { sessions = [], settings = DEFAULT_SETTINGS } = await chrome.storage.local.get({
    sessions: [],
    settings: DEFAULT_SETTINGS,
  });
  render(sessions as LocalSession[], settings as ExtensionSettings);
}

function render(sessions: LocalSession[], settings: ExtensionSettings) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = sessions.filter(
    (s) => new Date(s.startedAt) >= todayStart && s.turnCount > 0,
  );

  const totalMin = Math.round(today.reduce((sum, s) => sum + s.durationSec, 0) / 60);
  const byPlatform = new Map<string, number>();
  for (const s of today) {
    byPlatform.set(s.platform, (byPlatform.get(s.platform) ?? 0) + s.durationSec);
  }

  const content = document.getElementById("content")!;
  if (today.length === 0) {
    content.innerHTML = `<div class="empty">No AI sessions yet today — that's
      perfectly fine. Use ChatGPT or Claude and your activity appears here.</div>`;
  } else {
    const maxSec = Math.max(...byPlatform.values(), 1);
    const bars = [...byPlatform.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(
        ([p, sec]) => `
        <div class="bar-row">
          <span class="name">${esc(PLATFORM_LABEL[p] ?? p)}</span>
          <div class="track"><div class="fill" style="width:${Math.round((sec / maxSec) * 100)}%"></div></div>
          <span>${Math.round(sec / 60)}m</span>
        </div>`,
      )
      .join("");
    content.innerHTML = `
      <div class="stats">
        <div class="stat"><b>${today.length}</b><span>session${today.length === 1 ? "" : "s"} today</span></div>
        <div class="stat"><b>${totalMin}m</b><span>time with AI</span></div>
      </div>
      <div class="bars">${bars}</div>
      <div class="energy">Energy estimates live in your dashboard — always as
        honest ranges with a confidence level, never a single made-up number.</div>`;
  }

  // Status + pause
  const dot = document.getElementById("dot")!;
  const statusText = document.getElementById("status-text")!;
  const pauseBtn = document.getElementById("pause-btn") as HTMLButtonElement;
  dot.className = settings.paused ? "dot paused" : "dot";
  statusText.textContent = settings.paused ? "paused" : "tracking";
  pauseBtn.textContent = settings.paused ? "Resume" : "Pause";
  pauseBtn.onclick = async () => {
    const next = { ...settings, paused: !settings.paused };
    await chrome.storage.local.set({ settings: next });
    load();
  };

  // Dashboard link + sync token
  (document.getElementById("dashboard-link") as HTMLAnchorElement).href =
    `${settings.apiBase}/dashboard`;
  const tokenInput = document.getElementById("token") as HTMLInputElement;
  const syncState = document.getElementById("sync-state")!;
  if (settings.syncToken) {
    tokenInput.value = settings.syncToken;
    syncState.textContent = "(connected — syncing metadata only)";
  }
  tokenInput.onchange = async () => {
    const token = tokenInput.value.trim() || null;
    await chrome.storage.local.set({ settings: { ...settings, syncToken: token } });
    chrome.runtime.sendMessage({ kind: "sync-now" }, () => void chrome.runtime.lastError);
    load();
  };
}

load();
