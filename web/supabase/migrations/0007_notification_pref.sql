-- Notification preferences per member
create table public.notification_pref (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.member(id) on delete cascade,
  channel text not null default 'email',
  category text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_pref_member_channel_category_key unique (member_id, channel, category),
  constraint notification_pref_category_check check (
    category in ('shift_offer', 'swap_request', 'swap_resolved', 'team_invite')
  )
);

alter table public.notification_pref enable row level security;

create policy "Members can view own prefs"
  on public.notification_pref for select
  using (member_id in (
    select id from public.member where auth_user_id = auth.uid()
  ));

create policy "Service role full access"
  on public.notification_pref for all
  using (true)
  with check (true);
