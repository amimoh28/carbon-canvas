/**
 * Background service worker (MV3 — ephemeral by design).
 *
 * Every state change is persisted to chrome.storage.local IMMEDIATELY
 * because Chrome kills this worker after ~30s idle (Blueprint TR-Worker).
 * Responsibilities: session lifecycle, local persistence, remote config,
 * and metadata-only sync (skipped entirely in local-only mode).
 */

import type {
  ContentMessage,
  ExtensionSettings,
  LocalSession,
  PlatformId,
} from "../shared/types";
import { DEFAULT_SETTINGS, SESSION_IDLE_MS } from "../shared/types";
import { DEFAULT_SELECTORS, type AdapterSelectors } from "../content/adapters";

// ---------- storage helpers (persist-immediately) ---------------------------

async function getSessions(): Promise<LocalSession[]> {
  const { sessions } = await chrome.storage.local.get({ sessions: [] });
  return sessions as LocalSession[];
}

async function setSessions(sessions: LocalSession[]): Promise<void> {
  // Cap local history so storage stays lightweight (oldest dropped).
  await chrome.storage.local.set({ sessions: sessions.slice(-500) });
}

async function getSettings(): Promise<ExtensionSettings> {
  const { settings } = await chrome.storage.local.get({ settings: DEFAULT_SETTINGS });
  return { ...DEFAULT_SETTINGS, ...(settings as ExtensionSettings) };
}

// ---------- remote config ---------------------------------------------------

interface RemoteConfigCache {
  fetchedAt: number;
  adapters: Record<PlatformId, AdapterSelectors>;
}

const CONFIG_TTL_MS = 15 * 60 * 1000;

async function getAdapterConfig(platform: PlatformId): Promise<AdapterSelectors> {
  const { configCache } = await chrome.storage.local.get("configCache");
  const cache = configCache as RemoteConfigCache | undefined;
  if (cache && Date.now() - cache.fetchedAt < CONFIG_TTL_MS && cache.adapters[platform]) {
    return cache.adapters[platform];
  }
  const settings = await getSettings();
  try {
    const res = await fetch(`${settings.apiBase}/api/config`, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json?.adapters) {
        const merged: RemoteConfigCache = {
          fetchedAt: Date.now(),
          adapters: { ...DEFAULT_SELECTORS, ...json.adapters },
        };
        await chrome.storage.local.set({ configCache: merged });
        return merged.adapters[platform] ?? DEFAULT_SELECTORS[platform];
      }
    }
  } catch {
    /* offline or backend down — baked-in defaults keep working */
  }
  return DEFAULT_SELECTORS[platform];
}

// ---------- session lifecycle ------------------------------------------------

function newClientEventId(): string {
  return `cc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Find the open (un-ended) session for a platform, if fresh enough. */
function findOpenSession(sessions: LocalSession[], platform: PlatformId): LocalSession | undefined {
  const s = sessions.findLast((x) => x.platform === platform && x.endedAt === null);
  if (!s) return undefined;
  const last = new Date(s.startedAt).getTime() + s.durationSec * 1000;
  if (Date.now() - last > SESSION_IDLE_MS) return undefined; // stale → new session
  return s;
}

async function handleActivity(msg: Extract<ContentMessage, { kind: "activity" }>): Promise<void> {
  const settings = await getSettings();
  if (settings.paused) return;

  const sessions = await getSessions();
  let session = findOpenSession(sessions, msg.platform);

  if (!session) {
    // Close any stale open session for this platform first.
    for (const s of sessions) {
      if (s.platform === msg.platform && s.endedAt === null) {
        s.endedAt = new Date(new Date(s.startedAt).getTime() + s.durationSec * 1000).toISOString();
      }
    }
    session = {
      clientEventId: newClientEventId(),
      platform: msg.platform,
      model: msg.model,
      startedAt: new Date().toISOString(),
      endedAt: null,
      durationSec: 0,
      turnCount: 0,
      estTokens: null,
      tokenConfidence: "low",
      synced: false,
    };
    sessions.push(session);
  }

  // Update with the latest observation. Counts are absolute (page state),
  // so we take maxima — a virtualized DOM can only undercount, never over.
  session.model = msg.model ?? session.model;
  session.turnCount = Math.max(session.turnCount, msg.turnCount);
  if (msg.estTokens !== null) {
    session.estTokens = Math.max(session.estTokens ?? 0, msg.estTokens);
    session.tokenConfidence = msg.tokenConfidence;
  }
  session.durationSec = Math.max(
    session.durationSec,
    Math.round((Date.now() - new Date(session.startedAt).getTime()) / 1000),
  );
  session.synced = false;

  await setSessions(sessions);
  scheduleSync();
}

async function handlePageHidden(platform: PlatformId): Promise<void> {
  const sessions = await getSessions();
  const open = sessions.find((s) => s.platform === platform && s.endedAt === null);
  if (open) {
    open.endedAt = new Date().toISOString();
    open.durationSec = Math.round(
      (new Date(open.endedAt).getTime() - new Date(open.startedAt).getTime()) / 1000,
    );
    open.synced = false;
    await setSessions(sessions);
    scheduleSync();
  }
}

// ---------- sync (metadata-only; no-op in local-only mode) -------------------

let syncTimer: ReturnType<typeof setTimeout> | undefined;

function scheduleSync(): void {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => void syncNow(), 5000);
}

async function syncNow(): Promise<void> {
  const settings = await getSettings();
  if (!settings.syncToken) return; // LOCAL-ONLY MODE: nothing ever leaves the device

  const sessions = await getSessions();
  const unsynced = sessions.filter((s) => !s.synced && s.turnCount > 0);
  if (unsynced.length === 0) return;

  // Strict allowlist payload — mirrors @carbon-canvas/schema. No text fields exist.
  const payload = {
    sessions: unsynced.slice(0, 100).map((s) => ({
      clientEventId: s.clientEventId,
      platform: s.platform,
      model: s.model,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSec: s.durationSec,
      turnCount: s.turnCount,
      estTokens: s.estTokens,
      tokenConfidence: s.tokenConfidence,
    })),
  };

  try {
    const res = await fetch(`${settings.apiBase}/api/ingest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.syncToken}`,
      },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const ids = new Set(payload.sessions.map((s) => s.clientEventId));
      const all = await getSessions();
      for (const s of all) if (ids.has(s.clientEventId)) s.synced = true;
      await setSessions(all);
    }
  } catch {
    /* offline — data stays local, retried on next activity */
  }
}

// ---------- message routing --------------------------------------------------

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.kind === "activity") {
    void handleActivity(msg as Extract<ContentMessage, { kind: "activity" }>);
  } else if (msg?.kind === "page-hidden") {
    void handlePageHidden((msg as { platform: PlatformId }).platform);
  } else if (msg?.kind === "get-config") {
    void getAdapterConfig((msg as { platform: PlatformId }).platform).then(sendResponse);
    return true; // async response
  } else if (msg?.kind === "sync-now") {
    void syncNow().then(() => sendResponse({ ok: true }));
    return true;
  }
  return undefined;
});
