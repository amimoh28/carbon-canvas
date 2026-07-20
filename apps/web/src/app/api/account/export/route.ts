/** GET /api/account/export — the user's complete data, machine-readable
 *  (PRD FR-12). What you see is ALL we have: metadata and estimates. */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const sessions = await prisma.aiSession.findMany({
    where: { userId: user.id },
    include: { estimate: true },
    orderBy: { startedAt: "asc" },
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: { email: user.email, createdAt: user.createdAt },
    note: "This is the complete set of data Carbon Canvas holds about you. No conversation content exists anywhere in it — by design, there is no field for it.",
    sessions: sessions.map((s) => ({
      platform: s.platform,
      model: s.model,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSec: s.durationSec,
      turnCount: s.turnCount,
      estTokens: s.estTokens,
      tokenConfidence: s.tokenConfidence,
      estimate: s.estimate
        ? {
            energyWhLow: s.estimate.energyWhLow,
            energyWhHigh: s.estimate.energyWhHigh,
            confidence: s.estimate.confidence,
            methodologyVersion: s.estimate.methodologyVersion,
            reasons: JSON.parse(s.estimate.reasonsJson),
            inputs: JSON.parse(s.estimate.inputsJson),
          }
        : null,
    })),
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="carbon-canvas-export.json"`,
    },
  });
}
