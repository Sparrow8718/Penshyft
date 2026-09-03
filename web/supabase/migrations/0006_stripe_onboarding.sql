-- Add Stripe billing columns and onboarding flag to org
alter table public.org
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column onboarding_completed boolean not null default false;

create unique index org_stripe_customer_id_idx on public.org (stripe_customer_id) where stripe_customer_id is not null;
