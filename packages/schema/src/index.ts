import { z } from "zod";

/**
 * The metadata-only sync contract.
 *
 * PRIVACY INVARIANT (PRD FR-16 / DR-4): this schema is a strict allowlist of
 * scalar metadata. There is deliberately no field capable of carrying prompt
 * or response text. The ingest endpoint validates with .strict(), so any
 * extra field — accidental or malicious — is rejected, not stored.
 */

export const PLATFORMS = ["chatgpt", "claude"] as const;
export type PlatformId = (typeof PLATFORMS)[number];

export const CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ConfidenceLevel = (typeof CONFIDENCE_LEVELS)[number];

export const sessionPayloadSchema = z
  .object({
    /** Client-generated stable id; makes ingest idempotent. */
    clientEventId: z.string().min(8).max(64),
    platform: z.enum(PLATFORMS),
    /** Model name if the UI exposed one. Unknown is a normal state. */
    model: z.string().max(80).nullable(),
    startedAt: z.string().datetime(),
    endedAt: z.string().datetime().nullable(),
    durationSec: z.number().int().min(0).max(60 * 60 * 24),
    turnCount: z.number().int().min(0).max(5000),
    /** Estimated from visible text length in-page; never exact. */
    estTokens: z.number().int().min(0).max(10_000_000).nullable(),
    tokenConfidence: z.enum(CONFIDENCE_LEVELS),
  })
  .strict();

export const ingestBatchSchema = z
  .object({
    sessions: z.array(sessionPayloadSchema).min(1).max(100),
  })
  .strict();

export type SessionPayload = z.infer<typeof sessionPayloadSchema>;
export type IngestBatch = z.infer<typeof ingestBatchSchema>;

/** Remote selector config served by the web app; lets us fix DOM breakage
 *  (or kill a broken adapter) without shipping a new extension build. */
export const adapterConfigSchema = z.object({
  enabled: z.boolean(),
  /** CSS selectors, tried in order until one matches. */
  turnSelectors: z.array(z.string()),
  userTurnSelectors: z.array(z.string()),
  modelSelectors: z.array(z.string()),
});

export const remoteConfigSchema = z.object({
  version: z.number().int(),
  adapters: z.record(z.enum(PLATFORMS), adapterConfigSchema),
});

export type AdapterConfig = z.infer<typeof adapterConfigSchema>;
export type RemoteConfig = z.infer<typeof remoteConfigSchema>;
