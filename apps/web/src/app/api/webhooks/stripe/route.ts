import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

type StripeObject = Record<string, any>;

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts.filter((part) => part.startsWith("v1=")).map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() / 1000 - timestampNumber) > 300) return false;

  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return signatures.some((signature) => {
    try {
      const candidate = Buffer.from(signature, "hex");
      return candidate.length === expectedBuffer.length && timingSafeEqual(candidate, expectedBuffer);
    } catch {
      return false;
    }
  });
}

function periodEnd(object: StripeObject): Date | null {
  return typeof object.current_period_end === "number"
    ? new Date(object.current_period_end * 1000)
    : null;
}

async function findUser(object: StripeObject) {
  const userId = object.metadata?.userId || object.client_reference_id;
  const email = object.metadata?.account_email || object.customer_details?.email || object.customer_email;

  if (userId) {
    const user = await prisma.user.findUnique({ where: { id: String(userId) } });
    if (user) return user;
  }
  if (email) return prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  return null;
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  if (!webhookSecret || !signature || !verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  let event: StripeObject;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const object = event.data?.object || {};

  if (event.type === "checkout.session.completed") {
    const user = await findUser(object);
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "pro",
          stripeCustomerId: object.customer ? String(object.customer) : user.stripeCustomerId,
          stripeSubscriptionId: object.subscription ? String(object.subscription) : user.stripeSubscriptionId,
          stripeSubscriptionStatus: object.payment_status === "paid" ? "active" : "pending",
        },
      });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
    const user = await findUser(object);
    if (user) {
      const active = ["active", "trialing"].includes(String(object.status));
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: active ? "pro" : "free",
          stripeCustomerId: object.customer ? String(object.customer) : user.stripeCustomerId,
          stripeSubscriptionId: object.id ? String(object.id) : user.stripeSubscriptionId,
          stripeSubscriptionStatus: String(object.status || "unknown"),
          stripeCurrentPeriodEnd: periodEnd(object),
        },
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const user = await findUser(object);
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          plan: "free",
          stripeSubscriptionStatus: "cancelled",
          stripeCurrentPeriodEnd: periodEnd(object),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
