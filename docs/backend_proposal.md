# PANIC Pasta — Backend Proposal

## TL;DR

Supabase-hosted Postgres backend with **Auth.js (NextAuth v5)** authentication using the **Prisma adapter and Prisma’s default Auth.js schema**. Single-household model: every user has exactly one household. Free tier: 1–3 members, 1 plan generation/day (up to 3 days). Pro tier: 1–6 members, pantry mode, 3 (re)generations/day (up to 1 month of meals). Plan generation uses a deterministic constraint engine before a **single LLM call per plan** (for v1) that produces all plan-days. Forks are only generated when members have differing requirements; if the base meal suits everyone, no forks are emitted. All tier limits and generation caps are `.env`-configurable.

> **Optional later:** Switch to a “one LLM call per plan-day with context” strategy if we want finer control and variety at the day level.

---

## 1. Auth — Auth.js (NextAuth v5) + Prisma

- **Auth.js** (NextAuth v5) with **Prisma adapter**.
- Use **Prisma’s default Auth.js schema**:
  - `User`, `Account`, `Session`, `VerificationToken` as per official NextAuth + Prisma docs.
- **Providers:**
  - Email **magic link** (passwordless) — primary auth method for v1
  - Google OAuth — **disabled by default** (`AUTH_GOOGLE_ENABLED=false`); implementation stubbed so it can be re-enabled via env flag without code changes
- **No password-based credentials flow in v1** (avoids reset/complexity).

### Session strategy

- **JWT sessions** (stateless) for API calls.
- Database-backed `User` table holds our app-specific fields.

### User model (app-specific extension)

We extend Prisma’s default `User` model with:

- `tier` — enum: `FREE` | `PRO` (default `FREE`)
- `stripeCustomerId` — optional string
- `generationsToday` — integer (per-day generation counter)
- `generationsResetAt` — datetime (for daily reset)
- `household` — 1:1 relation to `Household`

> Exact Prisma model will follow the standard NextAuth + Prisma schema, with these extra fields added to `User`.

### On first sign-in

- If `User` record is new:
  - Create default `Household` for the user:
    - `name = "My Household"`
  - Initialize:
    - `tier = FREE`
    - `generationsToday = 0`
    - `generationsResetAt = now()`

---

## 2. Database — Supabase-hosted Postgres (via Prisma)

Supabase is used purely as a **managed Postgres instance**.  
We **do not** use Supabase Auth or RLS in v1.

- All ownership and access control is enforced in the **app layer** using `session.user.id` from Auth.js.

### Core tables (beyond Prisma Auth.js defaults)

We rely on Prisma to generate SQL, but conceptually we have:

```sql
-- ENUM types

CREATE TYPE diet_type AS ENUM (
  'none',
  'vegetarian',
  'vegan',
  'pescatarian',
  'keto',
  'paleo',
  'halal',
  'kosher'
);

CREATE TYPE age_group_type AS ENUM (
  'adult',
  'teen',
  'child'
);

CREATE TYPE plan_status_type AS ENUM (
  'generating',
  'ready',
  'failed'
);

-- Households: one per user
CREATE TABLE households (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Household',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Members: free 1–3, pro 1–6 (enforced in app layer)
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age_group age_group_type NOT NULL DEFAULT 'adult',
  diet diet_type NOT NULL DEFAULT 'none',

  -- Arrays of text for preferences/constraints
  allergies TEXT[] NOT NULL DEFAULT '{}',
  dislikes  TEXT[] NOT NULL DEFAULT '{}',
  goals     TEXT[] NOT NULL DEFAULT '{}',

  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plans
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  num_days INT NOT NULL CHECK (num_days BETWEEN 1 AND 31),

  -- Per-meal-slot configuration (extendable)  
  -- Keys are meal slot IDs (e.g. breakfast, lunch, dinner, snack_1, meal_1…meal_5)  
  -- Values are objects with at least { enabled: boolean }
  meals_enabled JSONB NOT NULL DEFAULT '{
	"meal_1": { "enabled": true, "label": "Breakfast", "type": "breakfast" },
	"meal_2": { "enabled": true, "label": "Lunch", "type": "meal" },
	"meal_3": { "enabled": true, "label": "Dinner", "type": "meal" },
	"meal_4": { "enabled": false, "label": "Evening snack", "type": "snack" }
  }',
  use_it_up_mode BOOLEAN NOT NULL DEFAULT false,
  status plan_status_type NOT NULL DEFAULT 'generating',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plan days: each day's meals stored as JSONB
CREATE TABLE plan_days (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_index INT NOT NULL CHECK (day_index >= 0),
  meals JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, day_index)
);

-- Pantry items (pro tier only, enforced in app layer)
CREATE TABLE pantry_items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

> Actual SQL will be generated by Prisma migrations; this snippet is the conceptual structure.

> `start_date` is stored as a `DATE` in Postgres, interpreted in the user’s local timezone on the frontend.

> IDs are string-based (`cuid()` via Prisma) and mapped to `TEXT` in Postgres. We do **not** rely on database-generated UUIDs or sequences.

> The `meals_enabled` column having the nested conceptual shape enables easy adding of meals/fields in future e.g. 
```
"meal_2": {  
	"enabled": true,  
	"label": "Lunch",  
	"order": 2,  
	"target_calories": 650  
	},
```

Consider indexes
```SQL
-- Recommended indexes (added via Prisma or raw SQL)

CREATE INDEX idx_members_household_sort
  ON members (household_id, sort_order);

CREATE INDEX idx_plans_household_created
  ON plans (household_id, created_at DESC);

CREATE INDEX idx_plan_days_plan_day_index
  ON plan_days (plan_id, day_index);

CREATE INDEX idx_pantry_items_household
  ON pantry_items (household_id);
```

### Meals JSONB shape

Each `plan_days.meals` JSON contains keys for `breakfast`, `lunch`, `dinner`.  
When a meal slot is disabled, the key is present with `null`.

```jsonc
{
  "breakfast": {
    "name": "Overnight Oats with Berries",
    "description": "Creamy overnight oats topped with mixed berries",
    "ingredients": ["rolled oats", "milk", "yogurt", "mixed berries", "honey"],
    "steps": ["Combine oats and milk...", "Refrigerate overnight...", "Top with berries..."],
    "prep_time_min": 10,
    "servings": 3,
    "macro_estimates": {
      "calories": 350,
      "protein_g": 12,
      "carbs_g": 55,
      "fat_g": 8
    },
    "shopping_items": [
      { "name": "rolled oats", "qty": "1 cup", "category": "pantry" },
      { "name": "mixed berries", "qty": "200g", "category": "produce" }
    ],
    // Forks only appear when needed — omitted if base suits everyone
    "forks": {
      "member-uuid-sam": {
        "reason": "dairy-free",
        "swaps": [
          { "original": "milk", "replacement": "oat milk" },
          { "original": "yogurt", "replacement": "coconut yogurt" }
        ],
        "notes": "Use dairy-free alternatives"
      }
    }
  },
  "lunch": null,         // lunch disabled for this plan
  "dinner": { /* ... */ }
}
```

When all members share the same dietary profile, `forks` is `{}` or omitted entirely.

> **Nutrition note:** macro estimates are **rough LLM estimates** only. We will clearly label them as approximate and non-medical.

> **Optional later:** integrate with a real nutrition database (e.g. USDA FoodData Central) once core product is stable.

The contract should be documented. Include e.g.
- `meals_enabled` must always include `breakfast`, `lunch`, `dinner` boolean keys.
- `plan_days.meals` must always have keys `breakfast`, `lunch`, `dinner`, set to either a full meal object or `null` when disabled.
- `forks` is either omitted, `{}`, or an object keyed by `memberId`.

The meals JSON is very extendable. In future it could hold for example:
```JSON
// Batch cooking
"meal_2": {
  "label": "Dinner", "type": "meal",
  "name": "Big Batch Chili",
  "is_batch_cook_root": true,
  "batch_group_id": "chili-week-1",
  "batch_servings": 8,
  "reheat_instructions": "Microwave 3–4 minutes, stir halfway",
  // ...
}
// and on another day:
"meal_3": {
  "label": "Dinner", "type": "meal",
  "name": "Chili Stuffed Baked Potatoes",
  "batch_group_id": "chili-week-1",
  "batch_source_day_index": 0,
  "is_leftover_meal": true,
  // ...
}

// or
// Easy (ADHD) meal
"meal_3": {
  "label": "Dinner", "type": "meal",
  "name": "Sheet Pan Chicken and Veg",
  "complexity": "low",            // "low" | "medium" | "high"
  "cleanup_load": "low",          // single pan, minimal dishes
  "step_count": 5,
  "max_parallel_steps": 1,        // how many things at once
  "time_estimates": {
    "prep_min": 10,
    "cook_min": 25
  },
  "adhd_friendly": true,
  "adhd_notes": [
    "You can prep veggies in the morning and cook later.",
    "Set a timer for 25 minutes so you don't forget the oven."
  ],
  // ...
}

// or
// Sensory friendly meal
"meal_3": {
 "label": "Dinner", "type": "meal", 
 "name": "Crispy Chicken with Plain Rice",
  "sensory_profile": {
    "textures": ["crispy", "firm"],
    "avoid_if": ["no_breading"], // e.g. if someone hates crumbs
    "serving_style": "components_separate" // vs "mixed"
  },
  "routine_profile": {
    "repeatable": true,    // works fine twice a week
    "novelty_level": "low"
  }
}
```

---

## 3. API Routes (Next.js Route Handlers)

These are App Router route handlers under `app/api`.

|Route|Method|Purpose|Auth|
|---|---|---|---|
|`/api/auth/[...nextauth]`|*|Auth.js catch-all|—|
|`/api/household`|GET|Get current user's household + members|✅|
|`/api/household`|PUT|Update household name|✅|
|`/api/members`|GET|List members|✅|
|`/api/members`|POST|Add member (enforces tier limit)|✅|
|`/api/members/[id]`|PUT|Update member prefs|✅|
|`/api/members/[id]`|DELETE|Remove member|✅|
|`/api/plans/generate`|POST|Generate plan (rate-limited, tier-gated)|✅|
|`/api/plans`|GET|List user's plans|✅|
|`/api/plans/[id]`|GET|Fetch plan + days|✅|
|`/api/plans/[id]/shopping-list`|GET|Computed shopping list|✅|
|`/api/pantry`|GET|List pantry items (pro only)|✅|
|`/api/pantry`|POST|Add pantry items (pro only)|✅|
|`/api/pantry/[id]`|DELETE|Remove pantry item|✅|
|`/api/webhooks/stripe`|POST|Billing events (Stripe)|Stripe sig|

All authenticated routes:
- Extract `session = await auth()` (Auth.js helper),
- Use `session.user.id` to scope queries to the user’s household,
- Enforce `tier` and feature gating in the handler.

---

## 4. Plan Generation Pipeline

```text
POST /api/plans/generate
  │
  ├─ 1. Auth + tier + rate limit checks
  │     • Require authenticated session
  │     • Read PLAN_DAILY_LIMIT_FREE / PLAN_DAILY_LIMIT_PRO from env
  │     • Use user.generationsToday / generationsResetAt to enforce limit:
  │         - If now > generationsResetAt + 24h → reset counter
  │         - If generationsToday >= limit → reject request
  │     • Validate num_days against PLAN_MAX_DAYS_FREE/PRO
  │
  ├─ 2. Load household members + pantry items (if use_it_up_mode)
  │
  ├─ 3. Constraint Engine (deterministic, no LLM)
  │     • Merge all members' allergies → hard-exclude set
  │     • Merge diets → compute base diet (most restrictive wins for base)
  │     • Identify members/groups who need forks (only those differing from base) (a group is a subset of household members who's diet differs but who share a diet, and the fork should be common between the group)
  │     • Compute per-member/group fork specs (swaps, additions, portions)
  │     • If pantry mode: score ingredients for "use-it-up" priority
  │
  ├─ 4. LLM Call (one per plan in v1)
  │     • Input includes:
  │         - Household-level constraints
  │         - Member fork specs
  │         - num_days and meals_enabled
  │         - Pantry priorities (if enabled)
  │     • Ask model to generate a full N-day plan with recipes
  │     • Output: structured JSON:
  │         { "days": [ { "day_index": 0, "meals": {...} }, ... ] }
  │
  ├─ 5. Validate + persist
  │     • Validate LLM output against Zod schema
  │     • Insert Plan row, then PlanDay rows for each day_index
  │     • Increment user.generationsToday (When incrementing `generationsToday`, do it in the same transaction as creating the plan, or via a single atomic `UPDATE` to avoid over-incrementing in concurrent requests)
  │
  └─ 6. Return plan ID
        Client can:
        • Poll GET /api/plans/[id]
        • Or we add SSE later (optional)
```

### Fork logic detail

Forks are **not always generated**. The engine compares each member against the base meal:

- If member’s diet/allergies/goals are satisfied by the base → **no fork** for that member.
- Members should, where possible, be grouped by common diet/allergies/goals.
- If member/group differs → create fork with:
    - `reason`
    - `swaps` (ingredient substitutions)
    - `notes` (extra explanation)

Result: a household of 3 vegans gets zero forks; a mixed household gets targeted forks only.

> **Optional later:** support per-meal portion tweaks (e.g. `extra_protein`, `smaller_portion` flags) for finer UI controls.

---

## 5. Environment Variables

```env
# --- Auth / NextAuth ---
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random-secret>

# Google OAuth (disabled by default — set AUTH_GOOGLE_ENABLED=true to enable)
AUTH_GOOGLE_ENABLED=false
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
EMAIL_FROM="PanicPasta <no-reply@panicpasta.app>"

# --- Database (Supabase-hosted Postgres) ---
DATABASE_URL=postgres://...

# Optional: if we ever use Supabase client SDK (storage, etc.)
SUPABASE_URL=
SUPABASE_ANON_KEY=

# --- Stripe ---
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRO_PRICE_ID=

# --- LLM ---
LLM_MODEL=gpt-4o-mini      # Model to use for generation
LLM_API_KEY=
LLM_MAX_TOKENS=4096

# --- Tier Limits (configurable) ---
PLAN_DAILY_LIMIT_FREE=1     # Max plan generations per day (free tier)
PLAN_DAILY_LIMIT_PRO=3      # Max plan generations per day (pro tier)
PLAN_MAX_DAYS_FREE=3        # Max days per plan (free tier)
PLAN_MAX_DAYS_PRO=30        # Max days per plan (pro tier)
MEMBERS_MAX_FREE=3          # Max members per household (free)
MEMBERS_MAX_PRO=6           # Max members per household (pro)

# --- Rate Limiting (generic API) ---
RATE_LIMIT_WINDOW_MS=60000   # 1 minute window
RATE_LIMIT_MAX_REQUESTS=30   # Max requests per window
```

---

## 6. Billing — Stripe

- Single **Pro subscription** product with one recurring price.
- Free tier is the default (no Stripe record required).

Stripe webhook handler:
- Endpoint: `/api/webhooks/stripe`
- Handles events:
    - `checkout.session.completed`
        - Look up customer by `customer` or metadata/email.
        - Set `user.tier = PRO`
        - Store `stripeCustomerId`
    - `customer.subscription.deleted`
        - Set `user.tier = FREE`
    - `invoice.payment_failed`
        - Option: grace period or immediate downgrade (v1: immediate downgrade is acceptable)
- Verify webhook signatures with `STRIPE_WEBHOOK_SECRET`.

---

## 7. Security & Production Concerns

| Concern           | Approach (v1)                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Auth              | Auth.js (NextAuth) with Prisma adapter; all protected routes call `auth()`                                      |
| Data isolation    | App-layer checks: all queries scoped by `session.user.id` and `household.user_id`                               |
| Rate limiting     | `generationsToday` + env-configured daily limits; generic request limiting per IP/user                          |
| Webhook security  | Stripe signature verification + early return on invalid signature                                               |
| Input validation  | Zod schemas for all API request bodies and query params                                                         |
| Env validation    | Zod schema for `process.env`; fail fast at startup if misconfigured                                             |
| Error handling    | Structured error responses, logging with correlation IDs where helpful                                          |
| LLM output safety | Zod validation for LLM JSON responses; retry on malformed JSON; constraints enforced by deterministic pre-layer |

> **Optional later:** Add Supabase Row-Level Security (RLS) once we standardize how Auth.js user IDs are forwarded into Postgres via JWT/custom claims.

---

## 8. Tech Stack Summary

|Layer|Choice|Why|
|---|---|---|
|Framework|Next.js 16 (App Router)|Required; already used for frontend|
|Auth|Auth.js (NextAuth v5) + Prisma adapter|Standard pattern, good docs, integrates with Prisma nicely|
|Database|Supabase-hosted Postgres|Managed Postgres, easy dashboard + backups|
|ORM|Prisma|First-class support with Auth.js, great DX, type-safe|
|Validation|Zod|Shared schemas for API inputs + LLM outputs|
|Billing|Stripe|Industry standard, simple subscription model|
|LLM|OpenAI API (configurable model)|Structured JSON output, works well with gpt-4o-mini|
|Styling|Tailwind CSS|Already used for the frontend landing page and components|

---

## 9. Implementation Priority

1. **Auth & DB wiring**
    - Set up Prisma with Supabase Postgres (`DATABASE_URL`).
    - Implement Auth.js with Prisma adapter and email magic link provider (Google OAuth stubbed but disabled via `AUTH_GOOGLE_ENABLED` flag).
    - Extend Prisma `User` model with `tier`, `stripeCustomerId`, `generationsToday`, `generationsResetAt`.
    - Auto-create `Household` on first sign-in.
2. **Members CRUD**
    - `/api/household` and `/api/members` endpoints.
    - Enforce `MEMBERS_MAX_FREE` / `MEMBERS_MAX_PRO` in app layer.
3. **Plan generation endpoint**
    - Implement constraint engine + single LLM call per plan.
    - Persist `Plan` + `PlanDay` rows.
    - Enforce daily/tier limits.
4. **Plan viewing**
    - API for fetching a plan + days.
    - Frontend calendar + recipe cards + fork chips consume this.
5. **Shopping list**
    - `/api/plans/[id]/shopping-list` that aggregates `shopping_items` across all days and groups by category.
6. **Download (pro only)**
	- Download/Export plans/shopping lists in CSV/Markdown/JSON format.
7. **Pantry (pro only)**
    - CRUD endpoints for pantry items.
    - Integrate into constraint engine as “use-it-up mode”.
8. **Stripe billing + tier gating**
    - Checkout integration, webhook handling, and gated UI for Pro features.
9. **Polish**
    - Better error states, loading skeletons, rate limit messaging, logging.
