import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";

const STRIPE_API = "https://api.stripe.com/v1/checkout/sessions";

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in before upgrading." }, { status: 401 });

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!secretKey || !priceId) {
    return NextResponse.json(
      { error: "Stripe is not connected yet. Configure STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID." },
      { status: 503 },
    );
  }

  const origin = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("allow_promotion_codes", "true");
  form.set("success_url", `${origin}/dashboard/optimize?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${origin}/dashboard/optimize?checkout=cancelled`);
  form.set("client_reference_id", user.id);
  form.set("metadata[userId]", user.id);
  form.set("metadata[account_email]", user.email);
  form.set("metadata[carbon_canvas_plan]", "pro");
  form.set("subscription_data[metadata][userId]", user.id);
  form.set("subscription_data[metadata][account_email]", user.email);
  form.set("subscription_data[metadata][carbon_canvas_plan]", "pro");

  if (user.stripeCustomerId) form.set("customer", user.stripeCustomerId);
  else form.set("customer_email", user.email);

  const stripeResponse = await fetch(STRIPE_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const session = await stripeResponse.json();
  if (!stripeResponse.ok || !session.url) {
    console.error("Stripe checkout error", session);
    return NextResponse.json(
      { error: session?.error?.message || "Stripe checkout could not be created." },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: session.url });
}
