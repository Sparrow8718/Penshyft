# Shift Filler — Progress Log

Living document. Keep chronological, newest at the bottom.

## Locked decisions
- **Product model:** Freemium. Free (1 site, 1 dept, 15 people, admin-only) / Starter £4.99 / Professional £14.99.
- **Core product:** Rota generation (proactive), shift filling is one operational feature within paid tiers.
- **AI rota:** All tiers. Constraint solver engine, not LLM-based. Marginal cost negligible.
- **Notifications:** Email + PWA push only. SMS dropped entirely.
- **Roles:** System Admin > Org Admin > Org Manager > Site Manager > Supervisor > User. Free tier = Org Admin only.
- **Multi-site:** Professional tier only. Cross-site views for Org Admin / Org Manager.
- **Areas:** Generic entity between site and shifts (relabelable per org: department/floor/ward/section/zone). Industry presets set the default label. Pricing axis (1 / 3 / 10 by tier).
- **Languages:** EN, FR, ES, PT from day one via next-intl.
- **Billing:** Stripe, scaffolded in test mode, off behind `BILLING_MODE=off` until first paying site.
- **Live accept feed:** Supabase Realtime (not polling).
- **Market:** horizontal domain model, vertical GTM. Care/nursery is beachhead.
- **Hosting:** local-only for dev/test. No Vercel until we explicitly flip to live.
- **Audit log:** Surfaced in UI with role-dependent visibility.

## Milestones
- [x] **M0** — Foundations: repo, providers, schema, dashboard shell, `/dev/inbox`, DB live
- [ ] **M1** — Staff & shifts core
- [ ] **M2** — Fill loop (blast → accept race → filled)
- [ ] **M3** — Pattern generator
- [ ] **M4** — Dashboard polish, timesheet CSV, settings
- [ ] **M5** — Stripe scaffold (off)

## M0 task status — all complete ✅
1. Scaffold Next.js + Tailwind + tokens — **done** (Next 16.3.3, Tailwind v4)
2. Provider interfaces + mock impls — **done** (SMS/Email/Billing + `/dev/inbox`)
3. Supabase schema + RLS migrations — **done**
4. Supabase local stack — **done** (Postgres, Auth, Realtime, Studio all running; migrations + seed applied; TS types generated)
5. Dashboard shell + navigation + theme — **done** (all routes, DB-backed Today screen)

## Where we are
- `cd web && npm run dev` → `http://localhost:3000` → redirects to `/dashboard`.
- Supabase Studio: `http://127.0.0.1:54323` · Mailpit (test emails): `http://127.0.0.1:54324`.
- Dashboard `/dashboard` renders live from the DB: coverage bar (per-role staffing) and today's shift cards. Seed shows *Willow Grove Care* with 1/3 carer coverage today.
- `/dev/inbox` sends and displays mock SMS/email as phone bubbles.

## Next up: M1
- Manager auth (email magic link) — one login page.
- Staff CRUD + CSV bulk import.
- Role management.
- "Post a shift" flow wired to the Blast button on the Today card.
- Eligibility engine (role match + no overlap).
