# Carbon Canvas

**Privacy-first AI usage intelligence.** See how you use AI — and what it asks
of the planet — without ever having your conversations read.

This repository contains the founding documents and the working MVP prototype.

## Founding documents

Read in order — each builds on the last:

1. [Product Strategy Review](PRODUCT_STRATEGY_REVIEW.md) — honest critique of the concept
2. [Technical Feasibility Assessment](TECHNICAL_FEASIBILITY_ASSESSMENT.md) — what's real, brittle, fantasy
3. [MVP Development Plan](MVP_DEVELOPMENT_PLAN.md) — validation-first plan with three gates
4. [PRD](PRD.md) — engineering-ready requirements with IDs and acceptance criteria
5. [UX Strategy](UX_STRATEGY.md) — calm-clarity design direction
6. [Engineering Blueprint](ENGINEERING_BLUEPRINT.md) — implementation architecture

## Prototype layout

```
packages/estimation   Pure, versioned energy-estimation engine (the credibility core)
packages/schema       Zod metadata allowlist — the privacy contract
apps/extension        Chrome MV3 extension (ChatGPT + Claude adapters)
apps/web              Next.js dashboard + API + SQLite (Prisma)
```

## Run it

Requires Node 22+ and pnpm.

```bash
pnpm install
pnpm -r test                                  # engine + adapter + schema tests

# Database
cd apps/web
printf 'DATABASE_URL="file:./dev.db"\n' > .env
pnpm db:push && pnpm db:seed                  # create SQLite DB + research sources

# Web app (dashboard + API)
pnpm build && NODE_ENV=production node_modules/.bin/next start -p 3000
# or for development:  pnpm dev

# Extension
pnpm --filter @carbon-canvas/extension build  # outputs apps/extension/dist/
```

Then:

1. Open `http://localhost:3000`, create an account.
2. Load the extension: Chrome → `chrome://extensions` → Developer mode →
   **Load unpacked** → select `apps/extension/dist/`.
3. Copy the sync token from **Dashboard → Settings** into the extension popup
   (or skip it — local-only mode is a first-class choice; nothing leaves the
   device).
4. Use ChatGPT or Claude normally. The popup shows today's activity; the
   dashboard shows trends, platform mix, and an honest energy range with
   confidence.

## Prototype adaptations (vs. the blueprint)

Documented deliberately — these swap for production choices later:

| Prototype | Production (per blueprint) |
|---|---|
| SQLite via Prisma | Postgres (Supabase) + RLS |
| Hand-rolled email/password + sync tokens | Managed auth (Clerk / Supabase) |
| In-memory rate limiting | Shared store (Redis/Postgres) |
| `/api/config` serves static defaults | Signed remote config + editing tool |
| Energy bands are cited placeholders | Externally reviewed methodology |

## The two invariants

Everything else can change; these cannot:

1. **No conversation content, structurally.** Text is read only in-page to
   compute counts and discarded; the sync payload is a strict zod allowlist;
   no database column can hold text.
2. **No single numbers.** Every estimate is a range with a confidence score,
   reasons, and a methodology version — uncertainty compounds honestly
   through the pipeline.
