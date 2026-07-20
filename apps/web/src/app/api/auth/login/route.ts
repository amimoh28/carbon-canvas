import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createAuthSession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
}).strict();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`login:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Same error either way — do not reveal which accounts exist.
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return NextResponse.json({ error: "Incorrect email or password" }, { status: 401 });
  }
  await createAuthSession(user.id);
  return NextResponse.json({ ok: true });
}
