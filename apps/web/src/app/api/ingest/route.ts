/**
 * POST /api/ingest — the extension's sync endpoint.
 *
 * Auth: extension sync token (Bearer). Validation: strict zod allowlist
 * (any unknown field — e.g. smuggled text — rejects the batch, PRD FR-16).
 * Idempotent: upsert on (userId, clientEventId) so retries never
 * double-count (PRD FR-19). Each stored session gets an energy estimate
 * computed by the versioned engine at write time.
 */

import { NextRequest, NextResponse } from "next/server";
import { ingestBatchSchema } from "@carbon-canvas/schema";
import { estimateSessionEnergy } from "@carbon-canvas/estimation";
import { prisma } from "@/lib/db";
import { userFromSyncToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const user = await userFromSyncToken(req.headers.get("authorization"));
  if (!user) {
    return NextResponse.json({ error: "Invalid or missing sync token" }, { status: 401 });
  }
  if (!rateLimit(`ingest:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }
  if (user.trackingPaused) {
    // Server-side pause honored even if a stale client keeps sending.
    return NextResponse.json({ ok: true, stored: 0, note: "tracking paused" });
  }

  const parsed = ingestBatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload failed metadata-allowlist validation", detail: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let stored = 0;
  for (const s of parsed.data.sessions) {
    const estimate = estimateSessionEnergy({
      platform: s.platform,
      model: s.model,
      turnCount: s.turnCount,
      estTokens: s.estTokens,
      tokenConfidence: s.tokenConfidence,
    });

    const data = {
      platform: s.platform,
      model: s.model,
      startedAt: new Date(s.startedAt),
      endedAt: s.endedAt ? new Date(s.endedAt) : null,
      durationSec: s.durationSec,
      turnCount: s.turnCount,
      estTokens: s.estTokens,
      tokenConfidence: s.tokenConfidence,
    };
    const estimateData = {
      energyWhLow: estimate.energyWhLow,
      energyWhHigh: estimate.energyWhHigh,
      confidence: estimate.confidence,
      confidenceScore: estimate.confidenceScore,
      reasonsJson: JSON.stringify(estimate.reasons),
      modelClass: estimate.modelClass,
      methodologyVersion: estimate.methodologyVersion,
      inputsJson: JSON.stringify(estimate.inputs),
    };

    // Idempotent upsert: a re-sent session updates in place, never duplicates.
    await prisma.aiSession.upsert({
      where: { userId_clientEventId: { userId: user.id, clientEventId: s.clientEventId } },
      create: {
        userId: user.id,
        clientEventId: s.clientEventId,
        ...data,
        estimate: { create: estimateData },
      },
      update: {
        ...data,
        estimate: { upsert: { create: estimateData, update: estimateData } },
      },
    });
    stored++;
  }

  return NextResponse.json({ ok: true, stored });
}
