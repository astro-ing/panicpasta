I have 48 hours to vibe code a SaaS (web) app. I have $6 of free API credits to vibe code with (and can get free API requests for in-app LLM usage). The project must use Next.js as the API layer (other services in the middle/behind are OK), and include A) A great landing page (design matters), B) productionisation (auth/db/billing, etc.), plus Markdown explaining the problem + who you are (brief writeup). Winner criteria: Completeness, excitement, 'business' value (in the sense of solving a problem and being marketable, but not strictly targeted at businesses), landing page quality, functionality, and code quality.

Here's my plan:

## (Household) Custom Meal Planner Web App

Name idea: **PANIC Pasta** (lowercase for npm)

### The “winner” positioning

**“One plan that keeps everyone happy.”**
Not just meal planning—**constraint solving across multiple people** with **mods per person**, but still producing *one shared plan*.

### Killer differentiator (what judges remember)

**Household-aware planning** (forks as first-class UI):

* You define **1–6 people** in a household (age group, goals, allergies, dislikes, diet).
* You generate **one shared plan** with **automatic “forks”** per person, like:
  * “Base meal + swap cheese → dairy-free version”
  * “Portion sizes per person (adult/child)”
  * “Add extra protein portion for Alex”
  * “Low-FODMAP swap list for Sam”

**UI signature:** Every meal renders as:
* **Base meal card** (shared)
* **Fork chips per person** (click to reveal that member’s swaps + notes)

This reads as “real product,” not “AI meal plan generator.”

---

## MVP scope that fits 48 hours

### Core flow

1. **Onboarding**
   * Sign up / log in
   * Create household → add members → preferences & constraints

2. **Pantry (lightweight, optional in v1)**
   * Quick ingredient chips / quick-add list
   * “Paste what you have” textarea → split lines → store as pantry items
   * **No receipt OCR/parsing in v1**

3. **Generate X days plan**
   * Toggle meals: breakfast / lunch / dinner (+ snacks optional)
   * Toggle: **Use-it-up mode** (prioritize pantry items via heuristic scoring)

4. **Output**
   * Simple calendar view
   * Recipe cards (structured + readable)
   * Shopping list grouped (produce / pantry / protein)
   * Per-person modification notes (forks UI)

### Keep nutrition “credible but lightweight”

* Don’t attempt perfect nutrition day 1.
* Do: “macro targets” + “calorie range” + “protein minimum.”
* **LLM should not be trusted as a nutrition database**; keep claims modest and clearly labeled as estimates.

> **Optional later:** Pull nutrient estimates from USDA FoodData Central for ingredient-level lookup. Only worth it once the core experience is rock-solid.

---

## Architecture / implementation approach (to keep quality high + costs low)

### Next.js as API layer (required)

* Use Next.js Route Handlers for:
  * Household CRUD
  * Plan generation
  * Billing webhooks
  * Gating checks

### “Rule engine first, LLM second”

To avoid inconsistent allergen mistakes and reduce token usage:

1. **Deterministic constraints layer** (hard rules first)
   * Allergies: hard excludes
   * Diet: hard rules (vegan/vegetarian/etc.)
   * Dislikes: soft excludes
   * Goals: add-on rules (e.g., “add protein side”)

1. **LLM renders recipes + formatting**
   * Input: allowed ingredients, base meal concept, computed forks
   * Output: clean structured JSON recipe cards + steps + shopping list items

**Cost control:** Aim for **one generation call per plan** (or per day), not per person.

---

## Premium/billing that feels legit (and fast)

* **Free:** 3-day plans + 1 household
* **Pro:** 14/30-day plans + multiple households + pantry mode + saved templates
  Use Stripe subscriptions and one webhook:
  * “payment succeeded → set role/tier”

**Productionization checklist**
* Auth + DB
* Env var validation
* Rate limiting on generation endpoint
* Webhook signature verification
* Error logging + basic monitoring
* Seed/demo data script

---

## Landing page concept (design-first)

**Hero:** “Don't panic, we'll pass'ta plan.”
**Interactive demo widget:** “2 adults + 1 kid, dairy-free + high protein → Generate sample day”

**Important:** The landing demo should return a **canned instant response** (no API call) so it always feels fast and polished.

> **Optional later**: a collection of hero taglines, demos and responses

### Sections that sell

* “Household constraints, solved”
* “One click → plan + shopping list”
* “Personalized swaps (without making two dinners)”
* Pricing + FAQ (allergies/safety, data privacy)

> **Optional later:** Weekly email digest / meal inspiration + “generate next week’s plan” workflow.
> 	May include: Personalised overview; This week at a glance; New / interesting meals just for them; Use-it-up recommendation; Fork highlight; Learning / feedback loop; Button / CTA back into app

---

## What to avoid (time traps)

* Full recipe scraping / huge recipe databases
* Perfect nutrition math / micronutrient tracking
* Infinite customization UI
* Grocery store integrations

> **Optional later:** Grocery integrations once retention is proven.

---

## Data model (simple + production-ish)

Minimum viable tables:
* User
* Household
* Member (prefs, goals)
* Plan (date range, settings, tier)
* PlanDay / Meals JSON (base recipe + forks + notes)
* PantryItem (optional)

Derived / computed:
* Shopping list grouped by category

---

## The “wow” feature you can add late

**“Use-it-up mode”**
“Prioritize ingredients I already have” (heuristic scoring is fine).

---

## If you want the highest chance to win

### Pick the meal planner, and make it *household-first*

It checks every judging box:

* **Completeness:** onboarding → generate → save → export shopping list
* **Business value:** obvious recurring use case
* **Excitement:** multi-person constraint solving + forks UI = memorable
* **Landing page quality:** food + family = easy to make beautiful
* **Code quality:** clean architecture, deterministic layer + structured generation

---

## A 48-hour build plan (meal planner)

**Possible step 0**: **tight MVP spec** with:
* exact pages/routes
* DB schema
* API contracts (JSON)
* “must-have” landing page sections + copy
* pricing tiers that feel real
  …all scoped to 48 hours.

**Step 1:** Landing page + theme (don’t leave design to the end) + core components (get the page up)
**Step 2:** Auth + DB + household/members CRUD
**Step 3:** Seed “demo household” + instant demo plan rendering (always works)
**Step 4:** Plan generation API (structured JSON) + save plans
**Step 5:** Shopping list generation + basic calendar view
**Step 6:** Billing + gating + webhook
**Step 7:** Polish (animations), README/Markdown writeup, deploy

---

## Your Markdown writeup

* **Problem** (1 paragraph)
* **Solution** (bullets)
* **Who it’s for**
* **How it works** (architecture diagram optional)
* **Tech choices** (Next.js API routes, DB, auth, billing)
* **Safety/limitations** (allergens, nutrition estimates; always verify ingredients)
* **Roadmap** (3 bullets)
* **About me** (3–5 lines)

> **Optional later:** Add screenshots/GIFs of the forks UI + landing demo widget for extra “judge wow.”
