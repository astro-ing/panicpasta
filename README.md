# 🍝 PANIC Pasta

**One plan that keeps everyone happy.**

PANIC Pasta is a household-aware meal planner that generates shared meal plans with automatic per-person "forks" — dietary modifications for allergies, diets, and picky eaters — so your household eats together without anyone cooking two dinners.

**Live:** [panicpasta.com](https://panicpasta.com)

---

## Features

- **Household profiles** — Define 1–6 members with age, diet, allergies, dislikes, and goals
- **One-click plan generation** — Constraint engine + LLM produces multi-day meal plans
- **Personal forks** — Automatic per-person swaps (e.g. dairy-free, extra protein) only when needed
- **Shopping lists** — Aggregated by category (produce, pantry, protein)
- **Pantry mode** (Pro) — "Use-it-up" prioritizes ingredients you already have
- **Tier system** — Free (3 members, 1 gen/day, 3-day plans) · Pro (6 members, 3 gen/day, 30-day plans)

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Auth | Auth.js v5 + Prisma adapter (Google OAuth, magic link) |
| Database | Supabase-hosted Postgres via Prisma 6 |
| Validation | Zod |
| LLM | OpenAI API (gpt-4o-mini) |
| Billing | Stripe (subscriptions + webhooks) |
| Styling | Tailwind CSS v4 + Framer Motion |
| Deployment | Vercel |

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **Supabase** project (free tier works) — [supabase.com](https://supabase.com)
- **Google OAuth** credentials — [console.cloud.google.com](https://console.cloud.google.com)
- **OpenAI API key** — [platform.openai.com](https://platform.openai.com)
- **Stripe** account (test mode for dev) — [stripe.com](https://stripe.com)
- Optional: **Resend** account for magic-link email — [resend.com](https://resend.com)

## Setup

### 1. Clone & install

```bash
git clone https://github.com/<your-org>/panic-pasta.git
cd panic-pasta
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.development.local
```

Edit `.env.development.local` with your secrets:

```bash
NEXTAUTH_SECRET=<openssl rand -base64 32>
DATABASE_URL=postgres://<user>:<pass>@db.<project>.supabase.co:5432/postgres
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
LLM_API_KEY=sk-<your-openai-key>
STRIPE_SECRET_KEY=sk_test_<your-key>
STRIPE_WEBHOOK_SECRET=whsec_<from stripe listen>
STRIPE_PRO_PRICE_ID=price_test_<your-price-id>
# Optional (magic link email):
EMAIL_SERVER_HOST=smtp.resend.com
EMAIL_SERVER_PASSWORD=re_<your-resend-key>
```

### 3. Set up the database

```bash
npx prisma migrate dev --name init
```

This creates all tables (User, Household, Member, Plan, PlanDay, PantryItem) in your Supabase Postgres.

### 4. Run development

```bash
npm run dev
```

Opens at **http://localhost:3000**. Dev mode uses relaxed rate limits (see `.env.development`).

To test Stripe webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Production Deployment (Vercel)

### 1. Push to GitHub

```bash
git remote add origin https://github.com/<your-org>/panic-pasta.git
git push -u origin main
```

### 2. Import to Vercel

- Import the repo at [vercel.com/new](https://vercel.com/new)
- Framework: **Next.js** (auto-detected)

### 3. Set environment variables

In Vercel → Settings → Environment Variables, add:

| Variable | Value |
|----------|-------|
| `NEXTAUTH_SECRET` | `<openssl rand -base64 32>` |
| `DATABASE_URL` | Production Supabase connection string |
| `GOOGLE_CLIENT_ID` | Production OAuth app |
| `GOOGLE_CLIENT_SECRET` | Production OAuth app |
| `LLM_API_KEY` | OpenAI API key |
| `STRIPE_SECRET_KEY` | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From Stripe dashboard webhook endpoint |
| `STRIPE_PRO_PRICE_ID` | `price_live_...` |
| `EMAIL_SERVER_HOST` | `smtp.resend.com` |
| `EMAIL_SERVER_PASSWORD` | Resend API key |

Non-secret values (`NEXT_PUBLIC_APP_URL`, tier limits) are already set in `.env.production`.

### 4. Run database migration

```bash
DATABASE_URL=<prod-url> npx prisma migrate deploy
```

### 5. Configure Stripe webhook

In Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://panicpasta.com/api/webhooks/stripe`
- Events: `checkout.session.completed`, `customer.subscription.deleted`, `invoice.payment_failed`

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── auth/signin/                # Sign-in (Google + magic link)
│   ├── dashboard/                  # Authenticated app
│   │   ├── household/              # Member management
│   │   ├── plans/                  # Plan list, generation, detail
│   │   │   ├── new/                # Plan generation form
│   │   │   └── [id]/              # Plan view + shopping list
│   │   └── pantry/                 # Pantry management (Pro)
│   └── api/                        # REST API routes
│       ├── auth/[...nextauth]/     # Auth.js handlers
│       ├── household/              # Household CRUD
│       ├── members/                # Member CRUD
│       ├── plans/                  # Plan list, detail, generate
│       ├── pantry/                 # Pantry CRUD (Pro)
│       └── webhooks/stripe/        # Billing webhooks
├── components/
│   ├── ui/                         # Button, Badge (CVA + Radix)
│   ├── landing/                    # Hero, Features, DemoWidget
│   └── dashboard/                  # HouseholdManager, SignOutButton
└── lib/
    ├── auth.ts                     # Auth.js v5 config
    ├── prisma.ts                   # Prisma client singleton
    ├── constraints.ts              # Deterministic diet constraint engine
    ├── llm.ts                      # OpenAI meal plan generation
    ├── schemas.ts                  # Zod schemas (API + LLM output)
    └── env.ts                      # Zod env validation
```

## Architecture

```
User signs in → Household auto-created → Add members with preferences
                                                    ↓
                              POST /api/plans/generate
                                        ↓
                        ┌───────────────────────────────┐
                        │  1. Constraint Engine          │
                        │     • Merge allergies          │
                        │     • Compute base diet        │
                        │     • Identify fork groups     │
                        ├───────────────────────────────┤
                        │  2. Single LLM Call            │
                        │     • Structured JSON output   │
                        │     • Zod validation           │
                        ├───────────────────────────────┤
                        │  3. Persist Plan + PlanDays    │
                        └───────────────────────────────┘
                                        ↓
                        View plan → Meal cards + Fork chips
                        Shopping list → Grouped by category
```

## License

MIT
