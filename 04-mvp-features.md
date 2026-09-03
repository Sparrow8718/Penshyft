# Shift Filler — MVP Feature List

Definitive feature list for the MVP. Every feature is mapped to a tier (Free / Starter / Professional) and a build milestone. Nothing ships that isn't on this list; nothing gets added without updating this doc.

**Pricing tiers:**
| | Free | Starter £4.99/mo | Professional £14.99/mo |
|---|---|---|---|
| Sites | 1 | 1 | 1 (+£5/extra) |
| Areas | 1 | 3 | 10 |
| People | 15 | 25 | 50 (+£1/extra 5) |
| Roles (user) | Org Admin only | All 6 | All 6 |
| Languages | EN/FR/ES/PT | EN/FR/ES/PT | EN/FR/ES/PT |

**User role hierarchy:** System Admin > Org Admin > Org Manager > Site Manager > Supervisor > User

---

## 1. Admin / Manager Tools

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 1.1 | Org creation + basic settings (name, industry preset, logo) | ✓ | ✓ | ✓ | M1 |
| 1.2 | Site management (add/edit/archive sites) | 1 site | 1 site | Multi-site | M1 |
| 1.3 | Area management within sites | 1 area | Up to 3 | Up to 10 | M1 |
| 1.4 | Role management (create/edit/archive roles per org) | ✓ | ✓ | ✓ | M1 |
| 1.5 | Staff CRUD (add/edit/deactivate/archive) | ✓ | ✓ | ✓ | M1 |
| 1.6 | Staff CSV bulk import | ✓ | ✓ | ✓ | M1 |
| 1.7 | Assign staff to roles (multi-role per person) | ✓ | ✓ | ✓ | M1 |
| 1.8 | Assign staff to areas | ✓ | ✓ | ✓ | M1 |
| 1.9 | Assign staff to multiple sites | — | — | ✓ | M3 |
| 1.10 | People cap enforcement (15 / 25 / 50 + add-on) | ✓ | ✓ | ✓ | M4 |
| 1.11 | Audit log — view (role-dependent visibility) | — | View own actions | Full org log | M4 |

---

## 2. User (Staff) Experience

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 2.1 | Staff login (email magic link) | — | ✓ | ✓ | M2 |
| 2.2 | View own rota (personal schedule) | — | ✓ | ✓ | M2 |
| 2.3 | Set personal availability (days/times available/unavailable) | ✓ | ✓ | ✓ | M2 |
| 2.4 | Set personal rules (max hours/week, no consecutive nights, preferred days off) | ✓ | ✓ | ✓ | M2 |
| 2.5 | Accept/decline open shift offers (in-app or email link) | — | ✓ | ✓ | M3 |
| 2.6 | Request time off | — | ✓ | ✓ | M3 |
| 2.7 | Swap shift request (propose swap to another staff member) | — | ✓ | ✓ | M4 |
| 2.8 | View own shift history | — | ✓ | ✓ | M4 |

*On Free tier, Org Admin enters availability/rules on behalf of staff (staff don't log in). On all tiers, admins can always edit staff availability/rules directly.*

---

## 3. Shift Lifecycle

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 3.1 | Post a manual shift (pick role, date, time, department) | ✓ | ✓ | ✓ | M1 |
| 3.2 | Edit/cancel a shift | ✓ | ✓ | ✓ | M1 |
| 3.3 | Shift status tracking (open → offered → filled → completed → cancelled) | ✓ | ✓ | ✓ | M1 |
| 3.4 | Eligibility engine (role match + availability + no overlap + rule compliance) | ✓ | ✓ | ✓ | M2 |
| 3.5 | Blast open shift to eligible staff (in-app + email) | — | ✓ | ✓ | M3 |
| 3.6 | First-tap-wins atomic accept (race-safe) | — | ✓ | ✓ | M3 |
| 3.7 | Auto-notify others when shift filled | — | ✓ | ✓ | M3 |
| 3.8 | Live accept feed (Supabase Realtime) | — | ✓ | ✓ | M3 |
| 3.9 | Re-blast a shift that had no takers | — | ✓ | ✓ | M3 |
| 3.10 | Shift notes (manager-visible, e.g. "bring ID badge") | ✓ | ✓ | ✓ | M1 |

---

## 4. Rota / Pattern Generator

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 4.1 | Define shift templates (role × weekday × time × headcount) | ✓ | ✓ | ✓ | M2 |
| 4.2 | Generate rota from templates for a chosen week/month | ✓ | ✓ | ✓ | M2 |
| 4.3 | AI auto-assign (constraint solver: availability, rules, fairness, coverage) | ✓ | ✓ | ✓ | M3 |
| 4.4 | Manual drag-and-drop rota editing (week view grid) | ✓ | ✓ | ✓ | M2 |
| 4.5 | Conflict detection (warns on rule/availability violations) | ✓ | ✓ | ✓ | M2 |
| 4.6 | Gap highlighting (unassigned slots clearly surfaced) | ✓ | ✓ | ✓ | M2 |
| 4.7 | Gap → open shift (one-click convert unassigned slot to blastable shift) | — | ✓ | ✓ | M3 |
| 4.8 | Copy previous week's rota as starting point | ✓ | ✓ | ✓ | M3 |
| 4.9 | Coverage requirement rules per department per time block | ✓ | ✓ | ✓ | M2 |
| 4.10 | Publish rota (lock it, notify staff of their upcoming schedule) | — | ✓ | ✓ | M3 |

---

## 5. Roles & Eligibility

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 5.1 | Custom roles per org (unlimited) | ✓ | ✓ | ✓ | M1 |
| 5.2 | Role colour coding | ✓ | ✓ | ✓ | M1 |
| 5.3 | Multi-role per staff member | ✓ | ✓ | ✓ | M1 |
| 5.4 | Role-based eligibility filtering for shifts | ✓ | ✓ | ✓ | M2 |
| 5.5 | Qualification/certification tracking per staff (expiry dates) | — | ✓ | ✓ | M4 |
| 5.6 | Expired qualification auto-blocks shift eligibility | — | ✓ | ✓ | M4 |

---

## 6. Notifications & Messaging

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 6.1 | Email notifications (shift offers, rota published, time-off responses) | — | ✓ | ✓ | M3 |
| 6.2 | PWA push notifications (shift offers, rota updates) | — | ✓ | ✓ | M3 |
| 6.3 | In-app notification centre (bell icon, unread count, history) | — | ✓ | ✓ | M3 |
| 6.4 | Weekly rota email to each staff member before the week starts | — | ✓ | ✓ | M4 |
| 6.5 | Quiet hours respect (notifications held during site-configured quiet window) | — | ✓ | ✓ | M3 |
| 6.6 | Notification preferences per user (opt in/out per channel per type) | — | ✓ | ✓ | M4 |

---

## 7. Reports & Exports

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 7.1 | Export rota to Excel (.xlsx) | ✓ | ✓ | ✓ | M2 |
| 7.2 | Export rota to PDF | ✓ | ✓ | ✓ | M2 |
| 7.3 | Timesheet summary (hours per person per week/month) | — | ✓ | ✓ | M4 |
| 7.4 | Coverage report (staffing vs requirements, gaps, fill rate) | — | — | ✓ | M5 |
| 7.5 | Staff response-rate stats (who accepts fastest, decline rate) | — | — | ✓ | M5 |
| 7.6 | Cost estimate report (hours × hourly rate per role) | — | — | ✓ | M5 |
| 7.7 | Export reports to Excel/PDF | — | — | ✓ | M5 |
| 7.8 | Cross-site report (compare staffing/coverage across sites) | — | — | ✓ | M5 |

---

## 8. Settings & Configuration

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 8.1 | Org profile (name, industry, logo, default timezone) | ✓ | ✓ | ✓ | M1 |
| 8.2 | Site settings (name, address, timezone, quiet hours) | ✓ | ✓ | ✓ | M1 |
| 8.3 | Area management (add/edit/archive within a site) | ✓ | ✓ | ✓ | M1 |
| 8.4 | Custom label for "area" (org can rename to department/floor/ward/section/zone) | ✓ | ✓ | ✓ | M1 |
| 8.5 | Industry presets at onboarding (seeds default roles, area label + terminology) | ✓ | ✓ | ✓ | M1 |
| 8.6 | Hourly rate per role (used in cost reports) | — | — | ✓ | M4 |
| 8.7 | Working time rules (max hours/day, max hours/week, min rest between shifts) | ✓ | ✓ | ✓ | M2 |
| 8.8 | Notification channel preferences (org-level defaults) | — | ✓ | ✓ | M3 |
| 8.9 | Billing management (current plan, upgrade/downgrade, payment method) | — | ✓ | ✓ | M5 |

---

## 9. Auth & Tenancy

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 9.1 | Sign up (email + password or magic link) | ✓ | ✓ | ✓ | M1 |
| 9.2 | Sign in / sign out | ✓ | ✓ | ✓ | M1 |
| 9.3 | Password reset | ✓ | ✓ | ✓ | M1 |
| 9.4 | Org-scoped data isolation (RLS by org_id) | ✓ | ✓ | ✓ | M1 |
| 9.5 | Role-based access control (6-tier hierarchy) | Admin only | All 6 | All 6 | M2 |
| 9.6 | Invite user to org (email invite flow) | — | ✓ | ✓ | M2 |
| 9.7 | Manage user roles within org (promote/demote) | — | ✓ | ✓ | M2 |
| 9.8 | Site-scoped permissions (Site Manager sees only their site) | — | — | ✓ | M3 |
| 9.9 | Cross-site access for Org Admin / Org Manager | — | — | ✓ | M3 |
| 9.10 | Deactivate/remove user from org | — | ✓ | ✓ | M2 |

---

## 10. Billing

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 10.1 | Free tier enforcement (caps on sites, areas, people) | ✓ | — | — | M4 |
| 10.2 | Stripe Checkout for plan upgrades | — | ✓ | ✓ | M5 |
| 10.3 | Stripe Customer Portal (manage subscription, invoices, payment) | — | ✓ | ✓ | M5 |
| 10.4 | Plan tier feature gating (middleware + server-side checks) | ✓ | ✓ | ✓ | M4 |
| 10.5 | Add-on billing (extra sites £5/mo, extra people blocks £1/5 ppl) | — | — | ✓ | M5 |
| 10.6 | Usage metering (people count, site count, area count) | ✓ | ✓ | ✓ | M4 |
| 10.7 | Upgrade prompts in UI when free/starter limits approached | ✓ | ✓ | — | M4 |
| 10.8 | 14-day free trial of Professional (no card required) | — | — | ✓ | M5 |

---

## 11. Global UI/UX

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 11.1 | Responsive layout (mobile-first, works on phone/tablet/desktop) | ✓ | ✓ | ✓ | M1 |
| 11.2 | Light + dark mode (system-aware, user-toggleable) | ✓ | ✓ | ✓ | M0 ✅ |
| 11.3 | Sidebar navigation with active route highlighting | ✓ | ✓ | ✓ | M0 ✅ |
| 11.4 | Site switcher in sidebar (paid multi-site) | — | — | ✓ | M3 |
| 11.5 | Today dashboard (coverage bars + shift cards) | ✓ | ✓ | ✓ | M0 ✅ |
| 11.6 | Rota week view (calendar grid) | ✓ | ✓ | ✓ | M2 |
| 11.7 | Staff list view | ✓ | ✓ | ✓ | M1 |
| 11.8 | Empty/loading/error states throughout | ✓ | ✓ | ✓ | M4 |
| 11.9 | Toast notifications for actions (saved, sent, error) | ✓ | ✓ | ✓ | M2 |
| 11.10 | Internationalisation — EN, FR, ES, PT (next-intl) | ✓ | ✓ | ✓ | M1 |
| 11.11 | Locale-aware date/time/number formatting | ✓ | ✓ | ✓ | M1 |
| 11.12 | PWA manifest + install prompt | — | ✓ | ✓ | M3 |
| 11.13 | Keyboard shortcuts for common actions | ✓ | ✓ | ✓ | M4 |
| 11.14 | Onboarding wizard (org setup → site → areas → roles → invite/add staff) | ✓ | ✓ | ✓ | M2 |

---

## 12. Dev & Ops (Local)

| # | Feature | Free | Starter | Pro | Milestone |
|---|---|---|---|---|---|
| 12.1 | Supabase local stack (Postgres, Auth, Realtime, Studio) | dev | dev | dev | M0 ✅ |
| 12.2 | Mock notification provider (email rendered in dev inbox) | dev | dev | dev | M0 ✅ |
| 12.3 | Dev inbox UI (/dev/inbox — email bubbles with clickable links) | dev | dev | dev | M0 ✅ |
| 12.4 | Seed script (demo org, site, staff, roles, shifts) | dev | dev | dev | M0 ✅ |
| 12.5 | Provider abstraction (NotificationProvider with email + push channels) | dev | dev | dev | M1 |
| 12.6 | Feature flag system (plan tier checks, billing mode) | dev | dev | dev | M4 |
| 12.7 | E2E test suite (Playwright — post shift → notify → accept race → filled) | dev | dev | dev | M3 |
| 12.8 | Unit tests (Vitest — eligibility engine, constraint solver, rule validation) | dev | dev | dev | M2 |

---

## Milestone summary

| Milestone | Focus | Key deliverables |
|---|---|---|
| **M0** ✅ | Foundations | Repo, tokens, providers, schema, dashboard shell, dev inbox |
| **M1** | Core setup + i18n | Auth, staff CRUD, roles, areas, sites, org settings, i18n framework, manual shift posting |
| **M2** | Rota builder | Shift templates, week view, rota generation, drag-and-drop, conflict detection, exports (Excel/PDF), user availability/rules, onboarding wizard |
| **M3** | Operational loop | AI auto-assign, shift blast, first-tap-wins, notifications (email + PWA), live feed, rota publish, multi-site (Pro), site switcher |
| **M4** | Polish + gating | Audit log UI, qualifications, weekly rota email, tier enforcement, upgrade prompts, empty/loading/error states, keyboard shortcuts |
| **M5** | Billing + reports | Stripe integration, plan management, add-ons, trial, full reports suite, cross-site reports |

---

## Scope changes from original plan

1. **Freemium model** — replaces flat £39/mo. Three tiers: Free / £4.99 / £14.99.
2. **Core product is rota generation** — shift filling is one operational feature, not the only product.
3. **SMS dropped** — notifications via email + PWA push only.
4. **Multi-site on Professional tier** — was out of v1, now in for paid.
5. **6-tier user role hierarchy** — was single manager role, now full RBAC.
6. **i18n from day one** — EN, FR, ES, PT via next-intl.
7. **AI rota on all tiers** — constraint solver, not LLM-based. Marginal cost is negligible.
8. **Areas as a concept** — new entity between site and shift, used as pricing axis.
9. **Free tier is manager-only** — staff don't log in; admin enters data on their behalf.
10. **Audit log surfaced in UI** — role-dependent visibility (Starter: own actions, Pro: full org).
