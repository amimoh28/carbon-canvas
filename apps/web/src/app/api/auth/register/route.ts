import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createAuthSession, newToken } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

const bodySchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
}).strict();

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "local";
  if (!rateLimit(`register:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Valid email and a password of 8+ characters required" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      // A sync token is minted at signup so pairing the extension is one paste.
      syncTokens: { create: { token: newToken("cct") } },
    },
  });
  await createAuthSession(user.id);
  return NextResponse.json({ ok: true });
}
