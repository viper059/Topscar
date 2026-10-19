-- Fixes from Supabase Security Advisor (2026-10-19)
-- 1) pin search_path on expire_listings
create or replace function public.expire_listings() returns void
language sql set search_path = '' as $$
  update public.listings set status = 'expired', updated_at = now()
  where status = 'active' and expires_at < now();
$$;

-- 2) views/contacts/saves and reports are written only by the site's server (service role),
--    which can rate-limit them; browsers can no longer insert directly and inflate stats or spam reports.
drop policy if exists "events insert" on public.listing_events;
drop policy if exists "reports insert" on public.reports;
