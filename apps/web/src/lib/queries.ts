/** Dashboard read queries. Every query is scoped by userId at the call site
 *  (per-user isolation in the data-access layer; RLS arrives with Postgres). */

import { prisma } from "./db";
import { aggregateEstimates, humanComparison } from "@carbon-canvas/estimation";

export interface OverviewData {
  totalSessions: number;
  totalMinutes: number;
  weekSessions: number;
  weekMinutes: number;
  weekDeltaPct: number | null;
  platformSplit: { platform: string; seconds: number }[];
  trend: { label: string; value: number }[];
  energy: {
    whLow: number;
    whHigh: number;
    confidence: string;
    comparison: string;
  } | null;
}

const DAY = 24 * 60 * 60 * 1000;

export async function getOverview(userId: string): Promise<OverviewData> {
  const since = new Date(Date.now() - 14 * DAY);
  const sessions = await prisma.aiSession.findMany({
    where: { userId, turnCount: { gt: 0 } },
    include: { estimate: true },
    orderBy: { startedAt: "asc" },
  });

  const now = Date.now();
  const weekAgo = now - 7 * DAY;
  const prevWeekAgo = now - 14 * DAY;

  const week = sessions.filter((s) => s.startedAt.getTime() >= weekAgo);
  const prevWeek = sessions.filter(
    (s) => s.startedAt.getTime() >= prevWeekAgo && s.startedAt.getTime() < weekAgo,
  );

  const weekDeltaPct =
    prevWeek.length > 0
      ? Math.round(((week.length - prevWeek.length) / prevWeek.length) * 100)
      : null;

  const platformSeconds = new Map<string, number>();
  for (const s of week) {
    platformSeconds.set(s.platform, (platformSeconds.get(s.platform) ?? 0) + s.durationSec);
  }

  // 14-day trend of session counts.
  const trend: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const dayStart = new Date(now - i * DAY);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + DAY);
    const count = sessions.filter(
      (s) => s.startedAt >= dayStart && s.startedAt < dayEnd,
    ).length;
    trend.push({
      label: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
      value: count,
    });
  }

  const weekEstimates = week
    .map((s) => s.estimate)
    .filter((e): e is NonNullable<typeof e> => e !== null)
    .map((e) => ({
      energyWhLow: e.energyWhLow,
      energyWhHigh: e.energyWhHigh,
      confidenceScore: e.confidenceScore,
    }));

  let energy: OverviewData["energy"] = null;
  if (weekEstimates.length > 0) {
    const agg = aggregateEstimates(weekEstimates);
    energy = {
      whLow: agg.energyWhLow,
      whHigh: agg.energyWhHigh,
      confidence: agg.confidence,
      comparison: humanComparison(agg.energyWhLow, agg.energyWhHigh),
    };
  }

  return {
    totalSessions: sessions.length,
    totalMinutes: Math.round(sessions.reduce((a, s) => a + s.durationSec, 0) / 60),
    weekSessions: week.length,
    weekMinutes: Math.round(week.reduce((a, s) => a + s.durationSec, 0) / 60),
    weekDeltaPct,
    platformSplit: [...platformSeconds.entries()]
      .map(([platform, seconds]) => ({ platform, seconds }))
      .sort((a, b) => b.seconds - a.seconds),
    trend,
    energy,
  };
}

export async function getSessionHistory(userId: string, limit = 50) {
  return prisma.aiSession.findMany({
    where: { userId, turnCount: { gt: 0 } },
    include: { estimate: true },
    orderBy: { startedAt: "desc" },
    take: limit,
  });
}
