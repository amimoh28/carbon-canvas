import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  if (!user.stripeCustomerId) return NextResponse.json({ error: "No Stripe customer is connected to this account." }, { status: 400 });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });

  const origin = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const form = new URLSearchParams({ customer: user.stripeCustomerId, return_url: `${origin}/dashboard/settings` });

  const stripeResponse = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const session = await stripeResponse.json();
  if (!stripeResponse.ok || !session.url) {
    return NextResponse.json({ error: session?.error?.message || "Billing portal could not be opened." }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}
