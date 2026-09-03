-- Row-Level Security. Every tenant table is scoped by org_id, resolved
-- through the member row whose auth_user_id matches auth.uid().

create or replace function current_org_ids()
returns setof uuid
language sql stable
as $$
  select org_id from member where auth_user_id = auth.uid();
$$;

create or replace function caller_can_access_site(p_site_id uuid)
returns boolean
language sql stable
as $$
  select exists (
    select 1
      from site s
      join member m on m.org_id = s.org_id
     where s.id = p_site_id
       and m.auth_user_id = auth.uid()
  );
$$;

-- Enable RLS on all tenant tables
alter table org                  enable row level security;
alter table site                 enable row level security;
alter table area                 enable row level security;
alter table member               enable row level security;
alter table role                 enable row level security;
alter table staff                enable row level security;
alter table staff_role           enable row level security;
alter table staff_area           enable row level security;
alter table shift_template       enable row level security;
alter table coverage_requirement enable row level security;
alter table rota_run             enable row level security;
alter table shift                enable row level security;
alter table shift_offer          enable row level security;
alter table message_log          enable row level security;
alter table audit_log            enable row level security;
alter table subscription         enable row level security;

-- org: read own orgs
create policy org_select on org for select using (id in (select current_org_ids()));

-- member: read own org members
create policy member_select on member for select using (org_id in (select current_org_ids()));

-- Direct org_id tables: read + write scoped by org
do $$
declare t text;
begin
  foreach t in array array[
    'site','role','staff','message_log','audit_log','subscription'
  ] loop
    execute format($p$
      create policy %I_rw on %I for all
        using  (org_id in (select current_org_ids()))
        with check (org_id in (select current_org_ids()));
    $p$, t, t);
  end loop;
end $$;

-- Site-scoped tables (org reached via site.org_id)
do $$
declare t text;
begin
  foreach t in array array[
    'area','shift_template','coverage_requirement','rota_run','shift'
  ] loop
    execute format($p$
      create policy %I_rw on %I for all
        using  (caller_can_access_site(site_id))
        with check (caller_can_access_site(site_id));
    $p$, t, t);
  end loop;
end $$;

-- staff_role: join through staff for org check
create policy staff_role_rw on staff_role for all
  using ( exists (select 1 from staff s where s.id = staff_role.staff_id
                    and s.org_id in (select current_org_ids())) )
  with check ( exists (select 1 from staff s where s.id = staff_role.staff_id
                         and s.org_id in (select current_org_ids())) );

-- staff_area: join through staff for org check
create policy staff_area_rw on staff_area for all
  using ( exists (select 1 from staff s where s.id = staff_area.staff_id
                    and s.org_id in (select current_org_ids())) )
  with check ( exists (select 1 from staff s where s.id = staff_area.staff_id
                         and s.org_id in (select current_org_ids())) );

-- shift_offer: join through shift → site for org check
create policy shift_offer_rw on shift_offer for all
  using ( exists (select 1 from shift sh
                    join site st on st.id = sh.site_id
                   where sh.id = shift_offer.shift_id
                     and st.org_id in (select current_org_ids())) )
  with check ( exists (select 1 from shift sh
                         join site st on st.id = sh.site_id
                        where sh.id = shift_offer.shift_id
                          and st.org_id in (select current_org_ids())) );
