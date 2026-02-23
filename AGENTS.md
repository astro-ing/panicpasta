# AGENTS.md

This file provides guidance to agents (i.e., ADAL) when working with code in this repository.

## Project Overview

**PANIC Pasta** — a household-aware meal planner SaaS that generates shared meal plans with per-person "forks" (dietary modifications). Built for a 48-hour vibe-coding hackathon. Currently in early stage: landing page is live, backend/auth/DB not yet implemented.

## Essential Commands

```bash
npm run dev       # Start dev server → http://localhost:3000
npm run build     # Production build (also catches TypeScript errors)
npm run start     # Serve production build
npm run lint      # ESLint (flat config, eslint.config.mjs)
```

No test framework is configured yet. No monorepo, no Docker, no environment variables required for current state.

## Tech Stack & Versions

| Layer | Tech | Version | Notes |
|-------|------|---------|-------|
| Framework | Next.js (App Router) | 16.1.6 | `src/app/` directory structure |
| React | React + ReactDOM | 19.2.3 | React 19 features available |
| Styling | Tailwind CSS v4 | ^4 | Via `@tailwindcss/postcss` plugin — **not** the legacy `tailwind.config.js` setup |
| Animations | Framer Motion | ^12 | Used in `DemoWidget` |
| UI primitives | CVA + Radix Slot | — | shadcn-inspired but custom-themed |
| Fonts | DM Sans + Fraunces | Google Fonts | Loaded via `next/font/google` in `layout.tsx` |
| Utilities | clsx + tailwind-merge | — | `cn()` helper in `src/lib/utils.ts` |

## Architecture

### Current State (Landing Page Only)

```
src/
├── app/
│   ├── layout.tsx          ← Root layout: fonts, metadata, body classes
│   ├── page.tsx            ← Landing page: Hero → Features → Footer
│   ├── globals.css         ← Tailwind v4 theme (colors, fonts, base styles)
│   └── favicon.ico
├── components/
│   ├── landing/
│   │   ├── hero.tsx        ← Hero section + DemoWidget
│   │   ├── features.tsx    ← 3-card feature grid
│   │   └── demo-widget.tsx ← Interactive "generate day" demo (canned response, client component)
│   └── ui/
│       ├── button.tsx      ← CVA button with neo-brutalist variants
│       └── badge.tsx       ← CVA badge (default/tomato/basil/outline)
└── lib/
    └── utils.ts            ← cn() utility
```

### Planned Architecture (from project plan)

The full app should eventually include:
- **Auth + DB** (NextAuth/Clerk + Supabase/Neon) — not yet implemented
- **Next.js Route Handlers** for: household CRUD, plan generation, billing webhooks
- **"Rule engine first, LLM second"** pattern: deterministic constraint layer (allergies, diets) runs before LLM generates recipe text
- **Stripe billing** with free/pro tiers gated by webhook
- **Data model**: User → Household → Member (prefs) → Plan → PlanDay/Meals JSON → Shopping list

See `docs/PANIC-Pasta_PROJECT_PLAN.md` for the full spec and 48-hour build plan.

## Design System

### Neo-Brutalist Style

The UI uses a distinctive neo-brutalist aesthetic. **Maintain this consistently**:
- **Thick borders**: `border-2` or `border-4` with `border-charcoal-900`
- **Hard shadows**: `shadow-[4px_4px_0px_0px_#1a1816]` (not blur shadows)
- **Hover lift**: `-translate-y-0.5` + shadow grows on hover, `translate-y-1` + shadow-none on active
- **Playful rotations**: slight `rotate-1`, `-rotate-2` on elements
- **Rounded corners**: `rounded-xl` to `rounded-3xl` (generous, not sharp)
- **Custom organic border**: `.border-organic` class in globals.css

### Color Palette (defined in `globals.css` `@theme`)

| Token | Hex | Usage |
|-------|-----|-------|
| `pasta-50` | `#fffdfa` | Page background |
| `pasta-100` | `#fcf8ec` | Section backgrounds |
| `pasta-200` | `#f5eed3` | Muted fills, badges |
| `tomato-400` | `#ff6b5b` | Accent light |
| `tomato-500` | `#ff4733` | Primary CTA, brand red |
| `tomato-600` | `#e63926` | Hover/dark variant |
| `charcoal-800` | `#2d2a26` | Body text, secondary |
| `charcoal-900` | `#1a1816` | Headlines, borders, shadows |
| `basil-400` | `#3a965f` | Success, dietary badges |
| `basil-500` | `#2b7a4b` | Success dark |

### Typography

- **Body**: `DM Sans` (`--font-dm-sans`) via `font-sans`
- **Headings**: `Fraunces` (`--font-fraunces`) via `font-serif` — variable font with `opsz`, `SOFT`, `WONK` axes
- Headings get `font-serif font-bold` automatically via base layer in `globals.css`

## Gotchas & Non-Obvious Details

### Tailwind CSS v4 — No `tailwind.config.js`
This project uses Tailwind v4 with the new CSS-based config (`@theme` block in `globals.css`). There is **no `tailwind.config.js`**. Custom colors, fonts, and theme tokens are defined in `src/app/globals.css`. PostCSS plugin is `@tailwindcss/postcss` (see `postcss.config.mjs`).

### DemoWidget Uses Canned Data
The interactive demo on the landing page (`demo-widget.tsx`) returns a **hardcoded response**, not an API call. This is intentional — it must always feel instant and polished. When the real API exists, the landing demo should still use canned data.

### Path Alias
`@/*` maps to `./src/*` (configured in `tsconfig.json`). Always use `@/components/...`, `@/lib/...` etc.

### No `basil-100` or `tomato-100` in Theme
The demo-widget references `bg-basil-100` and `bg-tomato-100` classes but these aren't defined in the theme. Tailwind v4 may auto-generate them, but if color issues arise, add explicit tokens to `globals.css`.

### Selection Color
Text selection is styled globally: `selection:bg-tomato-500 selection:text-white` (on `<body>` in `layout.tsx`).

## Key Documents

| File | Purpose |
|------|---------|
| `docs/PANIC-Pasta_PROJECT_PLAN.md` | Full product spec, architecture, data model, build plan |
| `docs/Assignment_Details.md` | Hackathon rules, grading criteria, submission requirements |
| `docs/Vibe-Coding-Bootcamp_Day-*.md` | Lecture notes from bootcamp |
| `_notes/prompts.md` | Prompt engineering notes |

## Planned Build Phases (from project plan)

1. ~~Landing page + theme~~ ✅ (current state)
2. Auth + DB + household/members CRUD
3. Seed demo household + instant demo plan rendering
4. Plan generation API (structured JSON) + save plans
5. Shopping list generation + calendar view
6. Billing + gating + webhooks
7. Polish, README writeup, deploy

## Submission Checklist

- Landing page screenshot (`landing_page_<team_name>.png`, min 1280px wide)
- All Next.js route components in zip
- Explainer markdown (`explainer_<team_name>.md`)
- Live deployment URL (Vercel)
- Public GitHub repo
