-- Admin accounts (2026-10-20)
-- Who may open /admin. Read only by the site's server (service role); no RLS policies on purpose.
-- Add or remove an admin in the SQL Editor:
--   insert into public.admins (email) values ('someone@example.com');
--   delete from public.admins where email = 'someone@example.com';
create table if not exists public.admins (
  email      text primary key check (email = lower(email)),
  added_at   timestamptz not null default now()
);
alter table public.admins enable row level security;
