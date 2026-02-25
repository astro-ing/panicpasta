# PANIC Pasta

One plan that keeps everyone happy.

PANIC Pasta is a household-aware meal planner that generates shared meal plans with per-person forks (dietary modifications) so households can eat together without cooking separate dinners.

Live: https://panicpasta.com

---

## Features

- Household profiles with member diets, allergies, dislikes, and goals
- Multi-day meal plan generation with selectable meal slots
- Deterministic constraint layer + LLM output validation
- Personal forks only where needed (no unnecessary variants)
- Shopping lists grouped by category, with email-to-account support
- Account settings for units (metric/imperial), newsletter, and billing state
- Stripe-powered Pro upgrade and cancel-at-period-end flow
- Env-driven tier limits (defaults: Free 2 members, Pro 6 members)

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth | Auth.js v5 + Prisma adapter |
| Database | Supabase Postgres + Prisma 6 |
| Validation | Zod |
| LLM | OpenAI API (env-configurable, `gpt-5-mini` in committed stage envs) |
| Billing | Stripe subscriptions + webhooks |
| Styling | Tailwind CSS v4 + Framer Motion |
| Deploy | Vercel |

## Useful Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run start        # run production build
npm run lint         # run eslint

npm run db:generate  # prisma client generate (dev env)
npm run db:migrate   # prisma migrate dev (dev env)
npm run db:push      # prisma db push (dev env)
npm run db:studio    # prisma studio (dev env)
```

## Prerequisites

- Node.js >= 18
- npm >= 9
- Supabase project
- OpenAI API key
- Stripe account (test mode for local)
- SMTP provider for magic links and shopping list emails (Resend recommended)
- Optional: Google OAuth credentials (disabled by default)

---

## Local Development Setup

### 1) Install

```bash
git clone https://github.com/<your-org>/panic-pasta.git
cd panic-pasta
npm install
```

### 2) Configure env

```bash
cp .env.example .env.development.local
```

Fill required values in `.env.development.local`:

```bash
# Required
NEXTAUTH_SECRET=<openssl rand -base64 32>
DATABASE_URL=<supabase pooled connection string>
DIRECT_URL=<supabase direct connection string>
LLM_API_KEY=<openai key>

# Required for magic-link sign-in + shopping-list email
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=resend
EMAIL_SERVER_PASSWORD=<resend api key>
EMAIL_FROM="PANIC Pasta Dev <no-reply@panicpasta.com>"

# Required for billing flows in dev
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Optional Google OAuth (disabled by default):

```bash
ENABLE_GOOGLE_OAUTH=true
NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Notes:
- `DATABASE_URL` should be the pooled URL for runtime.
- `DIRECT_URL` should be the direct DB URL for Prisma migrations.
- If your DB password contains special characters, URL-encode it.

### 3) Generate Prisma client and apply migrations

```bash
npm run db:generate
npm run db:migrate
```

If you want quick schema sync during early local iteration:

```bash
npm run db:push
```

### 4) Start app

```bash
npm run dev
```

Open http://localhost:3000

### 5) Stripe webhook forwarding (local)

In a second terminal:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET` and restart `npm run dev` if needed.

---

## Production Setup (Vercel)

### 1) Push repository and import to Vercel

- Push your branch/repo to GitHub
- Import project in Vercel (`Next.js` auto-detected)

### 2) Set production env vars

Add these in Vercel Project Settings -> Environment Variables:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_URL` | yes | e.g. `https://panicpasta.com` |
| `NEXTAUTH_URL` | yes | same as app URL |
| `NEXTAUTH_SECRET` | yes | generate fresh for production |
| `DATABASE_URL` | yes | Supabase pooled runtime URL |
| `DIRECT_URL` | recommended | for migrations/maintenance |
| `LLM_API_KEY` | yes | OpenAI key |
| `STRIPE_SECRET_KEY` | yes | `sk_live_...` |
| `STRIPE_PRO_PRICE_ID` | yes | live price id |
| `STRIPE_WEBHOOK_SECRET` | yes | webhook signing secret |
| `EMAIL_SERVER_HOST` | yes | e.g. `smtp.resend.com` |
| `EMAIL_SERVER_PORT` | yes | e.g. `587` |
| `EMAIL_SERVER_USER` | yes | SMTP user |
| `EMAIL_SERVER_PASSWORD` | yes | SMTP password/API key |
| `EMAIL_FROM` | yes | verified sender |
| `ENABLE_GOOGLE_OAUTH` | optional | set `true` to enable |
| `NEXT_PUBLIC_ENABLE_GOOGLE_OAUTH` | optional | set `true` to show button |
| `GOOGLE_CLIENT_ID` | optional | required if Google enabled |
| `GOOGLE_CLIENT_SECRET` | optional | required if Google enabled |

Tier and rate-limit settings are configurable via env as well:

- `PLAN_DAILY_LIMIT_FREE`
- `PLAN_DAILY_LIMIT_PRO`
- `PLAN_MAX_DAYS_FREE`
- `PLAN_MAX_DAYS_PRO`
- `MEMBERS_MAX_FREE`
- `MEMBERS_MAX_PRO`
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX_REQUESTS`

### 3) Run production migrations

From a trusted environment with production DB credentials:

```bash
dotenv -e .env.production.local -- npx prisma migrate deploy
```

Or set env inline in your CI/deploy job and run `npx prisma migrate deploy`.

### 4) Configure Stripe production webhook

Create webhook endpoint:

- URL: `https://<your-domain>/api/webhooks/stripe`
- Events:
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

Use the endpoint signing secret as `STRIPE_WEBHOOK_SECRET`.

### 5) Smoke test

- Magic-link sign-in
- Plan generation
- Shopping list email
- Upgrade to Pro checkout
- Cancel at period end flow

---

## Env File Strategy

This project uses layered env files:

- `.env` (shared defaults)
- `.env.development` (dev defaults)
- `.env.production` (prod defaults)
- `.env.local` (local overrides)
- `.env.development.local` (dev secrets)
- `.env.production.local` (prod secrets)

Tier and plan limits are read from environment at runtime, so stage-specific local overrides (for example `.env.development.local`) are honored.

---

## Project Structure

```text
src/
  app/
    page.tsx                          # marketing homepage
    auth/
      signin/page.tsx                 # magic-link sign-in (Google optional)
      error/page.tsx
    dashboard/
      page.tsx                        # overview
      account/page.tsx                # account + billing + prefs
      household/page.tsx              # member management
      pantry/page.tsx                 # pantry (Pro-gated)
      plans/
        page.tsx
        new/page.tsx                  # plan generation form
        [id]/page.tsx
        [id]/shopping/page.tsx
    api/
      account/route.ts
      auth/[...nextauth]/route.ts
      billing/
        checkout/route.ts
        subscription/route.ts
        cancel/route.ts
      household/route.ts
      members/route.ts
      members/[id]/route.ts
      plans/
        route.ts
        generate/route.ts
        [id]/route.ts
        [id]/shopping-list/route.ts
        [id]/shopping-list/email/route.ts
      pantry/route.ts
      pantry/[id]/route.ts
      webhooks/stripe/route.ts
  components/
    landing/
    dashboard/
    ui/
  lib/
    auth.ts
    prisma.ts
    constraints.ts
    llm.ts
    schemas.ts
    env.ts
```

## License

MIT
