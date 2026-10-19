-- Let the owner edit protected fields from the Supabase dashboard (2026-10-20)
-- The guards only apply to requests from the website (roles anon / authenticated).
-- Edits made in the Supabase Table Editor or SQL Editor (role postgres) and by the
-- site's server (service_role) are trusted.

create or replace function public.guard_profile_admin_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.verified := false; new.plan := 'free'; new.plan_until := null; new.credits := 0;
    else
      new.verified := old.verified; new.plan := old.plan; new.plan_until := old.plan_until; new.credits := old.credits;
    end if;
  end if;
  return new;
end $$;

create or replace function public.guard_listing_admin_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('anon', 'authenticated') and coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.inspected := false; new.market_price := null;
      new.posted_at := now(); new.expires_at := now() + interval '60 days';
    else
      new.inspected := old.inspected; new.market_price := old.market_price; new.posted_at := old.posted_at;
      new.expires_at := least(new.expires_at, now() + interval '60 days');
      new.owner_id := old.owner_id;
    end if;
  end if;
  new.updated_at := now();
  return new;
end $$;

create or replace function public.enforce_listing_cap() returns trigger
language plpgsql set search_path = '' as $$
declare cap int; n int;
begin
  if current_user not in ('anon', 'authenticated') or coalesce(auth.role(), '') = 'service_role' then return new; end if;
  if new.status = 'active' and (tg_op = 'INSERT' or old.status is distinct from 'active') then
    select case p.plan when 'free' then 5 when 'vip' then 30 else null end into cap
      from public.profiles p where p.id = new.owner_id;
    if cap is not null then
      select count(*) into n from public.listings l
        where l.owner_id = new.owner_id and l.status = 'active' and l.id <> new.id;
      if n >= cap then
        raise exception 'listing_cap_reached:%', cap using errcode = 'P0001';
      end if;
    end if;
  end if;
  if tg_op = 'INSERT' and new.status = 'hidden' then
    select count(*) into n from public.listings l where l.owner_id = new.owner_id and l.status = 'hidden';
    if n >= 10 then raise exception 'too_many_drafts' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
