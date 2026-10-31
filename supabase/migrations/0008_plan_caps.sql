-- New plan limits (2026-10-31): free 1, VIP 15, Pro unlimited active listings at a time.
-- Keep in sync with PLAN_CAP in src/lib/plans.ts. Existing listings stay up; the cap is checked
-- only when a listing becomes active.
create or replace function public.enforce_listing_cap() returns trigger
language plpgsql set search_path = '' as $$
declare cap int; n int;
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    select case p.plan when 'free' then 1 when 'vip' then 15 else null end into cap
      from public.profiles p where p.id = new.owner_id;
    if cap is not null then
      select count(*) into n from public.listings l
        where l.owner_id = new.owner_id and l.status = 'active' and l.id <> new.id;
      if n >= cap then
        raise exception 'listing_cap_reached:%', cap using errcode = 'P0001';
      end if;
    end if;
  end if;
  -- drafts ("hidden") are capped too, so nobody can fill the database with unfinished listings
  if tg_op = 'INSERT' and new.status = 'hidden' then
    select count(*) into n from public.listings l where l.owner_id = new.owner_id and l.status = 'hidden';
    if n >= 10 then raise exception 'too_many_drafts' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
