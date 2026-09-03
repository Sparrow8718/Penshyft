-- Penshyft — M1 consolidated schema
-- Horizontal by design: no industry-specific columns. Care homes, nurseries,
-- pubs, retailers, security firms all use the same primitives.

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ---------- tenancy ----------

create table org (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  industry     text not null default 'other'
                 check (industry in ('care','nursery','hospitality','retail','security','healthcare','events','other')),
  area_label   text not null default 'Area',
  logo_url     text,
  plan         text not null default 'free'
                 check (plan in ('free','starter','professional')),
  created_at   timestamptz not null default now()
);

create table site (
  id                 uuid primary key default gen_random_uuid(),
  org_id             uuid not null references org(id) on delete cascade,
  name               text not null,
  address            text,
  timezone           text not null default 'Europe/London',
  quiet_hours_start  time not null default '21:00',
  quiet_hours_end    time not null default '07:00',
  archived           boolean not null default false,
  created_at         timestamptz not null default now()
);
create index on site(org_id);

create table area (
  id         uuid primary key default gen_random_uuid(),
  site_id    uuid not null references site(id) on delete cascade,
  name       text not null,
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (site_id, name)
);
create index on area(site_id);

create table member (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid not null references org(id) on delete cascade,
  auth_user_id  uuid unique,
  name          text not null,
  email         citext not null,
  role          text not null default 'org_admin'
                  check (role in ('system_admin','org_admin','org_manager','site_manager','supervisor','user')),
  created_at    timestamptz not null default now(),
  unique (org_id, email)
);
create index on member(org_id);
create index on member(auth_user_id);

-- ---------- roles / staff ----------

create table role (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references org(id) on delete cascade,
  name       text not null,
  colour     text,
  archived   boolean not null default false,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create table staff (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid not null references org(id) on delete cascade,
  name       text not null,
  email      text,
  mobile     text,
  active     boolean not null default true,
  archived   boolean not null default false,
  notes      text,
  created_at timestamptz not null default now()
);
create index on staff(org_id);
create unique index staff_org_email_uniq on staff(org_id, email) where email is not null;
create unique index staff_org_mobile_uniq on staff(org_id, mobile) where mobile is not null;

create table staff_role (
  staff_id  uuid not null references staff(id) on delete cascade,
  role_id   uuid not null references role(id)  on delete cascade,
  primary key (staff_id, role_id)
);
create index on staff_role(role_id);

create table staff_area (
  staff_id  uuid not null references staff(id) on delete cascade,
  area_id   uuid not null references area(id)  on delete cascade,
  primary key (staff_id, area_id)
);
create index on staff_area(area_id);

-- ---------- pattern generator ----------

create table shift_template (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references site(id) on delete cascade,
  role_id     uuid not null references role(id) on delete restrict,
  area_id     uuid references area(id) on delete set null,
  weekday     smallint not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  headcount   int  not null check (headcount > 0),
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index on shift_template(site_id);

create table coverage_requirement (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references site(id) on delete cascade,
  role_id     uuid not null references role(id) on delete cascade,
  area_id     uuid references area(id) on delete set null,
  weekday     smallint not null check (weekday between 0 and 6),
  start_time  time not null,
  end_time    time not null,
  min_count   int  not null check (min_count > 0),
  label       text
);
create index on coverage_requirement(site_id);

create table rota_run (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references site(id) on delete cascade,
  week_start    date not null,
  generated_at  timestamptz not null default now(),
  generated_by  uuid references member(id)
);
create index on rota_run(site_id, week_start);

-- ---------- shifts + offers ----------

create table shift (
  id          uuid primary key default gen_random_uuid(),
  site_id     uuid not null references site(id) on delete cascade,
  role_id     uuid not null references role(id) on delete restrict,
  area_id     uuid references area(id) on delete set null,
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  status      text not null default 'open'
                check (status in ('open','offered','filled','cancelled')),
  filled_by   uuid references staff(id),
  source      text not null default 'manual'
                check (source in ('manual','generated')),
  rota_run_id uuid references rota_run(id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now(),
  filled_at   timestamptz
);
create index on shift(site_id, date);
create index on shift(status);

create table shift_offer (
  id            uuid primary key default gen_random_uuid(),
  shift_id      uuid not null references shift(id) on delete cascade,
  staff_id      uuid not null references staff(id) on delete cascade,
  token         text not null unique,
  sent_at       timestamptz not null default now(),
  responded_at  timestamptz,
  outcome       text check (outcome in ('accepted','declined','filled_elsewhere','expired')),
  unique (shift_id, staff_id)
);
create index on shift_offer(shift_id);
create index on shift_offer(staff_id);

-- ---------- logs, billing ----------

create table message_log (
  id          uuid primary key default gen_random_uuid(),
  org_id      uuid references org(id) on delete cascade,
  channel     text not null check (channel in ('email','push')),
  to_address  text not null,
  body        text not null,
  provider    text not null,
  status      text not null default 'sent'
                check (status in ('queued','sent','delivered','failed')),
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index on message_log(org_id, created_at desc);

create table audit_log (
  id         uuid primary key default gen_random_uuid(),
  org_id     uuid references org(id) on delete cascade,
  actor      text,
  action     text not null,
  entity     text,
  meta       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on audit_log(org_id, created_at desc);

create table subscription (
  id                          uuid primary key default gen_random_uuid(),
  org_id                      uuid not null references org(id) on delete cascade,
  site_id                     uuid references site(id) on delete cascade,
  stripe_customer_id          text,
  stripe_subscription_id      text,
  status                      text not null default 'trial'
                                check (status in ('trial','active','past_due','cancelled')),
  notifications_used_this_period int not null default 0,
  period_end                  timestamptz,
  created_at                  timestamptz not null default now()
);

-- ---------- atomic fill helper ----------

create or replace function accept_shift_offer(p_offer_id uuid)
returns int
language plpgsql
as $$
declare
  v_shift_id  uuid;
  v_staff_id  uuid;
  v_updated   int;
begin
  select shift_id, staff_id into v_shift_id, v_staff_id
    from shift_offer where id = p_offer_id;

  if v_shift_id is null then
    return 0;
  end if;

  update shift
     set status = 'filled', filled_by = v_staff_id, filled_at = now()
   where id = v_shift_id and status in ('open','offered');
  get diagnostics v_updated = row_count;

  if v_updated = 1 then
    update shift_offer set outcome = 'accepted', responded_at = now()
      where id = p_offer_id;
    update shift_offer set outcome = 'filled_elsewhere'
      where shift_id = v_shift_id and id <> p_offer_id and outcome is null;
  end if;

  return v_updated;
end;
$$;
