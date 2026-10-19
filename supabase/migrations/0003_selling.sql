-- Selling: photo storage + plan limits (2026-10-19)

-- ---------- listing limits per plan ----------
-- free 5, vip 30, pro unlimited active listings at a time. Checked when a listing becomes active.
create or replace function public.enforce_listing_cap() returns trigger
language plpgsql set search_path = '' as $$
declare cap int; n int;
begin
  if coalesce(auth.role(), '') = 'service_role' then return new; end if;
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
  -- drafts ("hidden") are capped too, so nobody can fill the database with unfinished listings
  if tg_op = 'INSERT' and new.status = 'hidden' then
    select count(*) into n from public.listings l where l.owner_id = new.owner_id and l.status = 'hidden';
    if n >= 10 then raise exception 'too_many_drafts' using errcode = 'P0001'; end if;
  end if;
  return new;
end $$;
create trigger listings_cap before insert or update of status on public.listings
  for each row execute function public.enforce_listing_cap();

-- re-listing a sold/expired car restarts its 60 days
create or replace function public.renew_on_reactivate() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status = 'active' and old.status in ('sold','expired') then
    new.expires_at := now() + interval '60 days';
    new.sold_at := null;
  elsif new.status = 'sold' and old.status is distinct from 'sold' then
    new.sold_at := now();
  end if;
  return new;
end $$;
create trigger listings_reactivate before update of status on public.listings
  for each row execute function public.renew_on_reactivate();

-- ---------- photo storage (Supabase Storage, public read) ----------
-- Files live at <user id>/<listing short id>/<n>.webp. Move to Cloudflare R2 when traffic grows.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 2097152, array['image/webp','image/jpeg'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/webp','image/jpeg'];

create policy "listing photos: read own folder" on storage.objects for select to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing photos: upload to own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "listing photos: delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = auth.uid()::text);
