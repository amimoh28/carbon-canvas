# Carbon Canvas Stripe setup

The codebase now supports a Personal Pro subscription with automatic account entitlement.

## Product

- Plan: Carbon Canvas Personal Pro
- Display price: CAD $9 per month
- Billing mode: recurring subscription
- Free users keep usage tracking, history, platform breakdowns, environmental estimates, AI receipts, and privacy controls.
- Pro users unlock the Optimize dashboard, recommendations, goals, reports, and exports.

## Required Vercel environment variables

Add these to both the public `carboncanvas` project and the logged-in `carboncanvas-ai-footprint-lab` project where applicable:

```text
STRIPE_SECRET_KEY=sk_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
PUBLIC_SITE_URL=https://carboncanvas.live
NEXT_PUBLIC_APP_URL=https://<dashboard-production-domain>
```

The public site uses `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, and `PUBLIC_SITE_URL` to create Checkout Sessions from `/api/create-checkout`.

The dashboard uses `STRIPE_SECRET_KEY`, `STRIPE_PRO_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`, and `NEXT_PUBLIC_APP_URL` for authenticated checkout, subscription entitlement, and the Stripe billing portal.

## Stripe product creation

In Stripe:

1. Create a product named `Carbon Canvas Personal Pro`.
2. Create a recurring monthly price of CAD $9.
3. Copy the resulting `price_...` identifier into `STRIPE_PRO_PRICE_ID`.

## Webhook

Create a Stripe webhook endpoint pointing to:

```text
https://<dashboard-production-domain>/api/webhooks/stripe
```

Subscribe to:

```text
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

The webhook verifies Stripe's signature before changing account access. It maps the subscription to the Carbon Canvas user ID or account email and changes `User.plan` between `free` and `pro`.

## Database migration

Apply the Prisma migration before enabling live payments:

```bash
pnpm --filter @carbon-canvas/web prisma migrate deploy
```

The migration adds the plan, Stripe customer, subscription, status, and current-period fields to `User`.

## Test checklist

1. Register or sign in to a test Carbon Canvas account.
2. Open Dashboard → Optimize.
3. Confirm free optimization cards are blurred and the Upgrade button is visible.
4. Complete Stripe Checkout using test mode.
5. Confirm the Stripe webhook returns HTTP 200.
6. Refresh Dashboard → Optimize and confirm recommendations are unblurred.
7. Open Settings and confirm `Personal Pro` and `Manage billing` appear.
8. Cancel the test subscription in Stripe and confirm the account returns to Free after the webhook arrives.
