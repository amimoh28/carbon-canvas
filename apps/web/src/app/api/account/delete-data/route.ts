/** POST /api/account/delete-data — delete all usage data (PRD FR-13).
 *  Immediate and real: sessions + estimates cascade away. Account remains
 *  so the user can keep using the product from a clean slate. */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/auth";

export async function POST() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { count } = await prisma.aiSession.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true, deletedSessions: count });
}
