-- Add invite/status columns to the member table
alter table member add column status text not null default 'active'
  check (status in ('pending','active','deactivated'));

alter table member add column invite_token text unique;
alter table member add column invited_by uuid references member(id);
alter table member add column invited_at timestamptz;

create index on member(invite_token) where invite_token is not null;
