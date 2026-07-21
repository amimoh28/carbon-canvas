const STRIPE_API = "https://api.stripe.com/v1/checkout/sessions";

module.exports = async function handler(request, response) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRO_PRICE_ID;

  if (!secretKey || !priceId) {
    return response.status(503).json({
      error: "Stripe is not connected yet. Add STRIPE_SECRET_KEY and STRIPE_PRO_PRICE_ID in Vercel."
    });
  }

  let body = request.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: "Enter a valid account email." });
  }

  const host = request.headers["x-forwarded-host"] || request.headers.host || "carboncanvas.live";
  const protocol = request.headers["x-forwarded-proto"] || "https";
  const siteUrl = (process.env.PUBLIC_SITE_URL || `${protocol}://${host}`).replace(/\/$/, "");

  const form = new URLSearchParams();
  form.set("mode", "subscription");
  form.set("customer_email", email);
  form.set("line_items[0][price]", priceId);
  form.set("line_items[0][quantity]", "1");
  form.set("allow_promotion_codes", "true");
  form.set("billing_address_collection", "auto");
  form.set("success_url", `${siteUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`);
  form.set("cancel_url", `${siteUrl}/pricing?checkout=cancelled`);
  form.set("subscription_data[metadata][carbon_canvas_plan]", "pro");
  form.set("subscription_data[metadata][account_email]", email);
  form.set("metadata[carbon_canvas_plan]", "pro");
  form.set("metadata[account_email]", email);

  try {
    const stripeResponse = await fetch(STRIPE_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: form.toString()
    });

    const session = await stripeResponse.json();
    if (!stripeResponse.ok || !session.url) {
      console.error("Stripe checkout error", session);
      return response.status(502).json({ error: session?.error?.message || "Stripe checkout could not be created." });
    }

    return response.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout request failed", error);
    return response.status(500).json({ error: "Checkout could not be opened. Please try again." });
  }
};
