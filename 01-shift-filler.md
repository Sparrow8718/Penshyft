# Shift Filler — Scoping

## Problem
Care homes and nurseries have legal minimum staffing ratios. When someone calls in sick, the manager works down a bank-staff list one WhatsApp/text at a time, often at 6am. Failing to fill = either running below ratio (regulatory risk) or paying an agency £15–30/hr on top of the base rate.

The pain isn't finding new workers — it's coordinating the pool they already have.

## Customer
- **Buyer:** deputy manager or manager of a single site (residential care, nursing home, or nursery), typically 20–80 staff on the books
- **First customers:** local sites within a 20-mile radius that you can visit in person. Start with independent operators, not chains — chains buy through head office.
- **Warm intro path:** LinkedIn search "care home manager" + Leicestershire/Nottinghamshire, offer free 30-day trial for 3 sites in exchange for weekly feedback calls

## MVP scope
**In:**
- Manager adds bank staff (name, mobile, roles they can cover)
- Manager posts a shift (date, time, role, site)
- App SMS-blasts eligible staff with shift details + one-tap accept link (magic link, no login)
- First to tap gets it, everyone else auto-notified it's filled
- Basic dashboard: filled/unfilled shifts, response times per staff member
- Weekly timesheet CSV export

**Out (v1):**
- Payroll integration
- Multi-site management
- DBS/right-to-work checks (assume staff are already vetted by the home)
- Staff-facing app

## Stack
- Next.js on Vercel
- Supabase (orgs, staff, shifts, responses tables)
- Twilio or MessageBird for SMS (MessageBird cheaper for UK)
- Stripe subscription
- Resend for admin emails

Estimated 10–14 days of evening/weekend work.

## Pricing
- £39/month per site, unlimited shifts and unlimited bank staff
- SMS included up to 300/month, then £0.05 each
- No per-shift fee — this is the wedge against Florence and similar marketplaces that charge per shift

At £39/month, a single avoided agency shift (£120+ markup) pays for 3+ months. This is the pitch in one line.

## Go-to-market

**First 30 days:** In-person visits to 15 local sites with a printed one-pager and an iPad demo. Target 3 free trials.

**Days 30–60:** Convert trials to paid. Ask each paying customer for one intro to another manager. Post short case studies in "Care Home Managers UK" and similar Facebook groups.

**Days 60–90:** LinkedIn outbound to care group operations directors (5–20 site groups). At this size the buyer is head office but the pain is site-level, so pitch is "let your managers stop paying agency fees."

## Risks & mitigations
- **GDPR (bank staff data):** Have a DPA template ready, minimal data collection (name + mobile + roles only), clear retention policy
- **SMS deliverability:** Use a UK-registered sender ID, avoid link shorteners that trip carrier filters
- **Night shift edge cases:** Timezone/quiet-hours config per site
- **Staff churn:** Bulk import from CSV, easy remove flow — don't make list maintenance painful
- **Competitor bundling:** Care management platforms (Access, PASS) offer this but at £200+/month for the whole suite; positioning is "just the shift filler, not a whole system"

## Ship plan
- **Week 1:** Auth, staff management, shift posting, SMS out, magic-link accept flow
- **Week 2:** Dashboard, timesheet export, Stripe billing, landing page
- **Week 3:** Onboard first 3 trial sites, fix whatever breaks

## Validation targets
- **30 days:** 3 sites in free trial, at least 20 shifts filled through the app
- **60 days:** 3 paying sites = £117 MRR
- **90 days:** 8 paying sites = £312 MRR, one intro-driven sale

If you can't get 3 paying sites in 60 days with warm local outreach, the pricing or the pitch is wrong — kill or pivot.
