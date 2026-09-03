# Shift Filler — MVP Build Plan

Companion to [01-shift-filler.md](01-shift-filler.md). This is the "how we build it" doc. Local-first: everything runs on `localhost` for dev/test. No Vercel, no cloud SMS spend, no live Stripe until we explicitly flip the switch.

---

## 0. Market: build horizontal, sell vertical

The scoping doc targets care homes and nurseries. That stays our **beachhead** — a sharp ICP with acute pain and legal coverage minimums makes the first sale easier. But the underlying job — *"I have a pool of qualified people, a slot just opened, fill it fast and fairly"* — is the same across many shift-based businesses:

- Hospitality (pubs, restaurants, hotels — waiting/kitchen/bar cover)
- Retail & warehousing (peak/seasonal cover, sickness backfill)
- Security & facilities (guards, cleaners with site/qualification requirements)
- Events & catering (casual pools, per-event crews)
- Healthcare-adjacent (dental, GP practices, pharmacies, veterinary)

**So we build the domain model horizontal and make the vocabulary configurable, then market vertically.** Concretely:

- No hard-coded care terms in the schema. "Roles/skills," "sites," "coverage requirements," "pool staff" — all generic.
- **"Coverage requirement" replaces "legal ratio"** as the primitive. A care home configures it as a statutory minimum; a pub configures it as "2 bar, 1 kitchen on a Friday night." Same mechanic, the manager decides what it means.
- Qualification/role gating is generic: only offer a shift to someone who holds the required role or skill (a nurse registration, a door-supervisor licence, a barista cert — the app doesn't care which).
- Light **industry presets** at onboarding (Care / Nursery / Hospitality / Retail / Security / Other) that just seed sensible default roles and terminology — a thin veneer, not separate codebases.

This costs us almost nothing at build time (it's mostly *not* hard-coding domain words) and keeps every larger market open. Go-to-market still starts local and vertical per the scoping doc.

---

## 1. Two products in one

The scoping doc framed this as a *shift filler*. This plan promotes a second capability to first-class status:

1. **Shift Filler** — reactive. Someone calls in sick → post an open shift → SMS-blast eligible staff → first-tap wins.
2. **Shift Pattern Generator** — proactive. Build the rota *before* the week starts. Define staffing requirements (roles × days × times × headcount), apply recurring patterns, auto-populate a week/month, and surface the gaps the filler then chases.

The generator feeds the filler: any slot the pattern leaves unassigned becomes a candidate open shift you can blast in one click. This is the wedge that makes the product sticky beyond "fire-fighting at 6am."

---

## 2. Local-first architecture

| Concern | Production intent | Local dev/test |
|---|---|---|
| App | Next.js (App Router) on Vercel | `next dev` on `localhost:3000` |
| DB / Auth | Supabase (hosted Postgres) | **Supabase local stack** via `supabase start` (Docker) — real Postgres + Auth on localhost |
| SMS | MessageBird (UK) | **Mock SMS adapter** — writes messages to a DB table + prints to console; a `/dev/inbox` page renders them like a phone |
| Billing | Stripe subscriptions | **Stripe test mode** behind a feature flag, or fully stubbed until GTM |
| Email | Resend | Mock adapter → same `/dev/inbox` |

**Provider abstraction (critical):** SMS, email, and billing each sit behind a small interface (`SmsProvider`, `EmailProvider`, `BillingProvider`). A `MOCK` / `LIVE` env switch chooses the implementation. This lets us build and test the *entire* accept-flow locally with zero spend, and swap to MessageBird/Stripe by changing one env var — no code changes in feature logic.

```
lib/providers/
  sms/{index.ts, mock.ts, messagebird.ts}
  email/{index.ts, mock.ts, resend.ts}
  billing/{index.ts, mock.ts, stripe.ts}
```

The magic-link accept flow works identically in mock mode — the mock "SMS" contains a real clickable localhost link, so the whole first-to-tap race is fully testable on one machine (open links in different browser profiles).

---

## 3. Stack detail

- **Framework:** Next.js 15, App Router, TypeScript, Server Actions for mutations
- **UI:** Tailwind CSS + **shadcn/ui** (Radix primitives) — the base for the "outstanding" dashboard (§5)
- **Data layer:** Supabase JS client + Row-Level Security; Drizzle or Supabase-generated types for type safety
- **Auth:** Supabase Auth (email magic link for managers). Staff never log in — they only get SMS accept links (unguessable signed tokens)
- **Validation:** Zod on every server action and API route
- **Dates/times:** Luxon, all storage in UTC, per-site timezone + quiet-hours config
- **Testing:** Vitest (unit — ratio logic, pattern generator, token signing), Playwright (E2E — post shift → mock SMS → accept race → filled)

---

## 4. Data model

```
org            (id, name, created_at)
site           (id, org_id, name, timezone, quiet_hours_start, quiet_hours_end)
manager        (id, org_id, auth_user_id, name, email, role)
staff          (id, org_id, name, mobile, active, notes)
role           (id, org_id, name)                     -- generic: Carer / Bartender / Guard / Nurse…
staff_role     (staff_id, role_id)                    -- who can cover what (skill/qualification gate)

-- Pattern generator
shift_template (id, site_id, role_id, weekday, start_time, end_time, headcount)
                                                       -- "Mon Carer 07:00–15:00 ×3"
rota_run       (id, site_id, week_start, generated_at)

-- Shifts
shift          (id, site_id, role_id, date, start_time, end_time,
                status[open|filled|cancelled], filled_by staff_id?, source[manual|generated])
shift_offer    (id, shift_id, staff_id, token, sent_at, responded_at,
                outcome[accepted|declined|filled_elsewhere|expired])

message_log    (id, org_id, channel[sms|email], to, body, provider, status, created_at)
audit_log      (id, org_id, actor, action, entity, created_at)
subscription   (id, org_id, site_id, status, sms_used_this_period, period_end)
```

Key rules enforced server-side:
- A staff member is only offered a shift if they hold the shift's role **and** aren't already booked in an overlapping shift.
- First accepted `shift_offer` transitions `shift → filled` **atomically** (DB transaction / conditional update) — the race is won exactly once; late taps get the "already filled" screen.
- Quiet hours: offers queued outside a site's SMS window are held until the window opens (unless the shift starts sooner — then override with a flag).

---

## 5. The dashboard — UI/UX spec

This is where we earn the "outstanding" bar. The dashboard is the product managers see every morning; it has to feel calmer than their current WhatsApp-at-6am reality.

### Design language
- **Clean, clinical-but-warm.** Generous whitespace, one accent colour, strong typographic hierarchy (Inter or Geist). Not a dense enterprise grid.
- **Light + dark mode**, system-aware.
- **Status as colour + shape**, never colour alone (accessibility; also many care managers are older): filled = green check, open = amber pulse, at-risk = red.
- Fully responsive — managers will open this on a phone on the floor.

### Screens

1. **Today (home)** — the money screen.
   - Top: a **coverage bar** per role for today ("Carers 6/6 ✓ · Seniors 1/2 ⚠"). Instantly answers "am I covered right now?" (statutory minimum for care; the manager's own target for anyone else)
   - Below: today's shifts as cards — filled (who) / open (blast button) / at-risk.
   - One-tap **"Fill this shift"** → confirm eligible-staff count → blast.

2. **Rota / Week view** — the pattern generator's canvas.
   - Calendar grid: days × roles, cells show assigned staff or an empty slot.
   - **"Generate from patterns"** button → applies `shift_template`s to the week, auto-assigns where an obvious candidate exists, leaves gaps highlighted.
   - Drag a staff member onto a slot to assign; empty slots have an inline **"Blast"** action.
   - Export week → timesheet CSV.

3. **Shifts** — list/filter of open + upcoming, response times, re-blast controls.

4. **Staff** — roster with roles, activity, response-rate stats, CSV bulk import, easy deactivate. Response-time leaderboard (who actually picks up) — genuinely useful for managers deciding who to call first.

5. **Live accept feed** — real-time (Supabase Realtime) list of taps as they land, so the manager watches a shift fill without refreshing.

6. **Settings** — site details, timezone, quiet hours, roles, SMS usage meter for the month.

### Staff-facing (no login)
- One page: the **accept screen** the SMS link opens. Big shift summary, one **Accept** button, honest states: *available → you got it → sorry, just filled*. Mobile-first, sub-second, no chrome.

### Dev-only
- **`/dev/inbox`** — renders every mock SMS/email as phone bubbles with working links. This is how we demo and test the whole loop locally.

---

## 6. Shift Pattern Generator — how it works

1. Manager defines **templates** per site: `(role, weekday, start, end, headcount)`. e.g. *Carer, Mon–Fri, 07:00–15:00, ×3*.
2. Optionally a **staffing-requirement layer**: minimum headcount per role per time-block (drives the "am I covered?" coverage bar and at-risk flags).
3. **Generate** for a chosen week/month → creates `shift` rows from templates.
4. **Auto-assign pass (v1, simple + explainable):** greedily assign staff who (a) hold the role, (b) are free, (c) have the best response history / fewest hours so far this week — spreading load fairly. Every auto-assignment is overrideable; nothing is sent to staff yet.
5. **Gaps** (unassigned slots) are surfaced in the week view and can be turned into open shifts and blasted individually or in bulk.

v1 is a transparent greedy assigner, not a black-box optimiser — managers must trust and edit it. A constraint-solver rota optimiser is a clear v2 upgrade path but out of scope now.

---

## 7. Build sequence (local throughout)

**Milestone 0 — Foundations (1–2 days)**
Repo, Next.js + Tailwind + shadcn, Supabase local stack, schema + RLS, seed script (1 org, 1 site, ~15 staff, roles), provider interfaces with mock impls, `/dev/inbox`.

**Milestone 1 — Staff & shifts core (2–3 days)**
Manager auth, staff CRUD + CSV import, role management, post a manual shift, eligibility engine.

**Milestone 2 — The fill loop (2–3 days)**
Blast via mock SMS → signed accept token → accept screen → atomic first-tap-wins → auto-notify others → live accept feed. Full E2E test of the race.

**Milestone 3 — Pattern generator (2–3 days)**
Shift templates, week view grid, generate-from-patterns, greedy auto-assign, gap → blast.

**Milestone 4 — Dashboard polish & exports (2 days)**
Today screen + coverage bar, staff stats, timesheet CSV, settings, dark mode, responsive pass, empty/loading/error states.

**Milestone 5 — Billing scaffold, still local (1 day)**
Stripe test-mode behind flag + SMS usage metering — wired but off until GTM.

~10–14 evenings, matching the scoping estimate, with the generator added by making the dashboard the spine rather than a bolt-on.

**Flip-to-live checklist (later, one sitting):** swap `MOCK→LIVE` env for SMS/email/billing, register UK sender ID, add MessageBird + Resend + Stripe keys, point at hosted Supabase, deploy. No feature code changes.

---

## 8. Decisions — locked

- **Pattern scope:** ✅ transparent greedy auto-assign for v1. Constraint-solver optimiser is a named v2 upgrade.
- **Billing:** ✅ scaffold Stripe test-mode now behind a flag, kept off until the first paying site.
- **Accept feed:** ✅ Supabase Realtime.

New for the horizontal reframe:
- **Industry presets** are seed data only (default roles + labels), never branching logic. One codebase.
- Schema uses generic primitives (`role`/`skill`, `coverage_requirement`) — no care-specific columns.
