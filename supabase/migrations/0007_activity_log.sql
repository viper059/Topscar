-- Traffic / activity log (2026-10-31)
-- Thai Computer Crime Act s.26 requires service providers to keep traffic data for at least 90 days.
-- Logins are already kept by Supabase in auth.audit_log_entries (with IP).
-- This table records who created, changed or deleted a listing or its phone/LINE, from which IP, and when.
-- It has no foreign keys, so the evidence stays after a seller deletes the listing (useful for scam reports).
-- Only the service role / dashboard can read it (RLS on, no policies).

create table if not exists public.activity_log (
  id          bigint generated always as identity primary key,
  at          timestamptz not null default now(),
  actor       uuid,                 -- auth.uid(), null for admin/dashboard edits
  db_role     text not null,        -- anon / authenticated / service_role / postgres
  action      text not null,        -- e.g. listings.insert, listing_contacts.update
  listing_id  uuid,
  short_id    text,
  detail      jsonb,
  ip          text,
  user_agent  text
);
create index if not exists activity_log_at_idx on public.activity_log (at);
create index if not exists activity_log_actor_idx on public.activity_log (actor);
create index if not exists activity_log_listing_idx on public.activity_log (listing_id);
alter table public.activity_log enable row level security;
revoke all on public.activity_log from anon, authenticated;

create or replace function public.log_activity() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  h   json;
  rec record;
  lid uuid;
  sid text;
  det jsonb;
begin
  begin
    h := nullif(current_setting('request.headers', true), '')::json;
  exception when others then h := null;
  end;
  rec := case when tg_op = 'DELETE' then old else new end;

  if tg_table_name = 'listings' then
    lid := rec.id; sid := rec.short_id;
    det := jsonb_build_object('brand', rec.brand, 'model', rec.model, 'year', rec.year,
                              'price', rec.price, 'status', rec.status, 'province', rec.province);
  else -- listing_contacts: keep the phone/LINE shown to buyers, it's the key evidence in scam cases
    lid := rec.listing_id;
    select short_id into sid from public.listings where id = lid;
    det := to_jsonb(rec) - 'listing_id';
  end if;

  insert into public.activity_log (actor, db_role, action, listing_id, short_id, detail, ip, user_agent)
  values (
    auth.uid(), current_user, tg_table_name || '.' || lower(tg_op), lid, sid, det,
    coalesce(h ->> 'cf-connecting-ip', split_part(h ->> 'x-forwarded-for', ',', 1), h ->> 'x-real-ip'),
    left(h ->> 'user-agent', 300)
  );
  return null;
exception when others then
  return null; -- logging must never block a seller's save
end $$;

revoke execute on function public.log_activity() from public, anon, authenticated;

drop trigger if exists listings_activity on public.listings;
create trigger listings_activity after insert or update or delete on public.listings
  for each row execute function public.log_activity();

drop trigger if exists listing_contacts_activity on public.listing_contacts;
create trigger listing_contacts_activity after insert or update or delete on public.listing_contacts
  for each row execute function public.log_activity();

-- Daily cleanup at 00:30 Bangkok time: traffic log after 180 days, guest reveal counters after 30 days.
select cron.schedule('purge-old-logs', '30 17 * * *', $$
  delete from public.activity_log where at < now() - interval '180 days';
  delete from public.contact_reveals where day < (now() at time zone 'Asia/Bangkok')::date - 30;
$$);
