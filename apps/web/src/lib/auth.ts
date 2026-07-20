/**
 * Prototype auth.
 *
 * PROTOTYPE ADAPTATION (documented in Blueprint §2): a managed provider
 * (Clerk/Supabase Auth) replaces this before any public deployment. This
 * implementation exists so the prototype runs with zero external accounts:
 * - Dashboard: email+password (bcrypt) + opaque session token in an
 *   httpOnly cookie, sessions stored in the DB.
 * - Extension: separate opaque sync token (Bearer) so it can be revoked
 *   independently of dashboard sessions.
 */

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const SESSION_COOKIE = "cc_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function newToken(prefix: string): string {
  return `${prefix}_${randomBytes(24).toString("base64url")}`;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createAuthSession(userId: string): Promise<string> {
  const token = newToken("sess");
  await prisma.authSession.create({
    data: { userId, token, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });
  return token;
}

export async function destroyAuthSession(): Promise<void> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.authSession.deleteMany({ where: { token } });
    cookies().delete(SESSION_COOKIE);
  }
}

/** Resolve the logged-in user from the session cookie, or null. */
export async function currentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.authSession.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
}

/** Resolve the user behind an extension sync token (Bearer), or null. */
export async function userFromSyncToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;
  const st = await prisma.syncToken.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!st || st.revokedAt) return null;
  return st.user;
}
