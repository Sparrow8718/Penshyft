# Shift Filler — Project Index

Single source of truth for what's agreed and where to find it. Keep this list short and current.

## Documents (project root)
- [01-shift-filler.md](01-shift-filler.md) — Scoping: problem, customer, MVP scope, pricing, GTM, risks.
- [02-mvp-plan.md](02-mvp-plan.md) — Build plan: horizontal architecture, stack, data model, dashboard spec, sequence.
- [03-progress.md](03-progress.md) — Running log: current milestone, task status, locked decisions.
- [04-mvp-features.md](04-mvp-features.md) — Definitive feature list: 12 categories × Free/Starter/Pro tiers, milestone mapping.

## Code
- `web/` — Next.js 15 app (App Router, TypeScript, Tailwind v4, shadcn/ui pattern).
- `web/supabase/migrations/` — SQL schema + RLS. Applied via Supabase CLI once Docker is installed.
- `web/supabase/seed/` — demo seed data.

## Conventions
- **Local-first.** No hosted deploys until GTM. All third-party services (SMS, email, billing) sit behind provider interfaces with mock impls; a `PROVIDER_MODE=MOCK|LIVE` env var flips them.
- **Horizontal by design.** No care-specific columns or hard-coded terms in the schema. Industry presets are seed data only.
- **One codebase, no branches for verticals.** Care/nursery is the beachhead; hospitality/retail/security/other reuse the same primitives.
- **New docs get a numbered prefix and an entry here.** No orphan markdown files.
