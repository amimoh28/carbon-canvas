// Shared message + storage types for the extension.
// PRIVACY INVARIANT: nothing in these types can carry conversation text.

export type PlatformId = "chatgpt" | "claude";
export type ConfidenceLevel = "high" | "medium" | "low";

/** A tracked session as stored locally (superset of the sync payload). */
export interface LocalSession {
  clientEventId: string;
  platform: PlatformId;
  model: string | null;
  startedAt: string; // ISO
  endedAt: string | null;
  durationSec: number;
  turnCount: number;
  estTokens: number | null;
  tokenConfidence: ConfidenceLevel;
  /** Whether this session has been synced to the backend. */
  synced: boolean;
}

/** Content script → worker messages. Numbers and enums only. */
export type ContentMessage =
  | {
      kind: "activity";
      platform: PlatformId;
      model: string | null;
      turnCount: number;
      /** Estimated from visible character count in-page; text is discarded there. */
      estTokens: number | null;
      tokenConfidence: ConfidenceLevel;
    }
  | { kind: "page-hidden"; platform: PlatformId };

export interface ExtensionSettings {
  paused: boolean;
  /** Sync token pasted from the dashboard; null = local-only mode. */
  syncToken: string | null;
  apiBase: string;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  paused: false,
  syncToken: null,
  apiBase: "http://localhost:3000",
};

/** End a session after this much inactivity. */
export const SESSION_IDLE_MS = 10 * 60 * 1000;
