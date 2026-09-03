-- Shift swap requests
create table shift_swap (
  id                  uuid primary key default gen_random_uuid(),
  shift_id            uuid not null references shift(id) on delete cascade,
  requester_staff_id  uuid not null references staff(id) on delete cascade,
  target_staff_id     uuid references staff(id) on delete set null,
  target_shift_id     uuid references shift(id) on delete set null,
  status              text not null default 'pending'
                        check (status in ('pending','approved','denied','cancelled','expired')),
  reason              text,
  token               text not null unique,
  manager_note        text,
  created_at          timestamptz not null default now(),
  resolved_at         timestamptz,
  resolved_by         uuid references member(id)
);

create index idx_shift_swap_shift on shift_swap(shift_id);
create index idx_shift_swap_requester on shift_swap(requester_staff_id);
create index idx_shift_swap_status on shift_swap(status) where status = 'pending';
create index idx_shift_swap_token on shift_swap(token);

-- RLS
alter table shift_swap enable row level security;

create policy "Members can view swap requests for their org shifts"
  on shift_swap for select
  using (
    exists (
      select 1 from shift s
      join area a on a.id = s.area_id
      join site si on si.id = a.site_id
      join member m on m.org_id = si.org_id
      where s.id = shift_swap.shift_id
        and m.auth_user_id = auth.uid()
    )
  );

create policy "Service role full access on shift_swap"
  on shift_swap for all
  using (auth.role() = 'service_role');
