-- Staff availability: per-day availability flags for rota generation
create table staff_availability (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references staff(id) on delete cascade,
  date       date not null,
  available  boolean not null default true,
  notes      text,
  created_at timestamptz not null default now(),
  unique (staff_id, date)
);

create index on staff_availability(staff_id, date);

alter table staff_availability enable row level security;

create policy staff_availability_rw on staff_availability for all
  using (
    exists (
      select 1 from staff s
      where s.id = staff_availability.staff_id
        and s.org_id in (select current_org_ids())
    )
  )
  with check (
    exists (
      select 1 from staff s
      where s.id = staff_availability.staff_id
        and s.org_id in (select current_org_ids())
    )
  );
