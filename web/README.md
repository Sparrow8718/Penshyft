# Penshyft

Freemium SaaS for rota generation and shift management. Built for organisations that rely on bank/agency staff — healthcare, hospitality, retail, logistics, and more.

## Tech Stack

- **Next.js 16** (App Router, Turbopack) with `proxy.ts` auth middleware
- **Supabase** (Postgres 17, Auth, Realtime, PostgREST) — local Docker stack for dev
- **TypeScript** strict mode
- **Tailwind CSS v4** with custom design tokens
- **next-intl v4** — 4 languages: EN, FR, ES, PT
- **Stripe** for billing (checkout, portal, webhooks)
- **Resend** for transactional email
- **jsPDF** for client-side PDF export

## Architecture

```
src/
  app/
    [lang]/(marketing)/   Public landing page (hero, features, pricing)
    [lang]/(auth)/         Login, signup, reset-password
    [lang]/(app)/          Authenticated app (sidebar layout, 21 pages)
    api/                   Stripe webhooks, iCal feed
  lib/
    auth/                  Session resolver, staff HMAC tokens, context provider
    billing/               Plan limits, usage checks
    db/                    Supabase clients (server, browser, auth), types, audit, realtime
    providers/             Notification + billing providers (mock/live via PROVIDER_MODE)
    site/                  Multi-site switching (cookie-based)
    notifications/         Preference checking
    rota/                  Auto-generation engine
    offers/                Shift offer blast
  components/              Sidebar, mobile nav, site picker, UI primitives
  messages/                i18n JSON files (en, fr, es, pt)
supabase/
  migrations/              7 SQL migrations (schema, RLS, availability, invites, swaps, stripe, notif prefs)
  seed.sql                 Dev seed data
```

## User Roles (6-tier)

System Admin > Org Admin > Org Manager > Site Manager > Supervisor > User

## Pricing Tiers

| | Free | Starter | Professional |
|---|---|---|---|
| Price | £0 | £4.99/mo | £14.99/mo |
| Sites | 1 | 3 | 10 |
| Areas | 1 | 5 | 25 |
| Staff | 15 | 50 | 250 |

## Getting Started

```bash
# Prerequisites: Node 20+, Docker Desktop (for Supabase)

# 1. Install dependencies
npm install

# 2. Start Supabase local stack
npx supabase start

# 3. Copy env and fill in Supabase keys from step 2
cp .env.example .env.local

# 4. Run migrations
npx supabase db reset

# 5. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Provider Mode

Set `PROVIDER_MODE` in `.env.local`:

- **MOCK** (default) — emails go to `/dev/inbox`, billing stubs plan limits locally
- **LIVE** — uses Resend for email, Stripe for billing (requires API keys)

## Key Patterns

- **Server component -> client component**: server loads data, passes as props
- **Server actions** in `actions.ts` files alongside pages
- **`db()`** returns service-role Supabase client for server-side queries
- **`getSession()` / `requireSession(locale)`** for auth
- **`checkPlanLimit(orgId, resource)`** enforces plan caps
- **`logAudit()`** fire-and-forget audit logging
- **Member vs Staff**: `member` = people with auth/login; `staff` = operational workers with token-based links
- **HMAC tokens** for staff portal, offer accept/decline, swap responses, iCal feed
- **Cookie-based site switching**: `sf-site-id` cookie, validated in `getSession()`
- **Supabase Realtime**: `useRealtimeTable()` hook auto-refreshes on DB changes

## Milestones Completed

- **M1**: Scaffold, schema, providers, Supabase stack
- **M2**: i18n (4 locales), auth (Supabase Auth), UI primitives
- **M3**: Settings CRUD (org, sites, areas, roles, coverage, templates), staff, shifts, rota generation, offer blasts, CSV import
- **M4**: Enhanced dashboard, availability calendar, activity feed, billing UI
- **M5**: Real email (Resend), team invites, shift swaps, reports/PDF/CSV export
- **M6**: Error/loading polish, profile page, PWA manifest, Stripe billing, onboarding wizard, iCal feed, shift filters, Supabase Realtime
- **M7**: Landing page, multi-site switching, notification preferences, staff detail page
