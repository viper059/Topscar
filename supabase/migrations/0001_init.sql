-- tops-car.com initial schema
-- Run in Supabase SQL editor, or `supabase db push`.

create extension if not exists pgcrypto;

-- ---------- members ----------
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null check (char_length(display_name) between 1 and 60),
  seller_type   text not null default 'private' check (seller_type in ('private','tent','dealer')),
  shop_name     text,
  shop_slug     text unique,
  province      text,
  -- no phone / LINE here: profiles are publicly readable. Contacts live in listing_contacts.
  verified      boolean not null default false,       -- set by admin after ID check
  plan          text not null default 'free' check (plan in ('free','vip','pro')),
  plan_until    timestamptz,
  credits       integer not null default 0 check (credits >= 0),
  pdpa_accepted_at timestamptz not null,
  created_at    timestamptz not null default now()
);

-- ---------- listings ----------
create table public.listings (
  id           uuid primary key default gen_random_uuid(),
  short_id     text not null unique default substr(replace(gen_random_uuid()::text,'-',''),1,8),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  cond         text not null check (cond in ('new','used')),
  brand        text not null,
  model        text not null,
  trim_name    text not null default '',
  year         smallint not null check (year between 1970 and 2100),
  km           integer not null default 0 check (km >= 0),
  price        integer not null check (price > 0),
  market_price integer,                             -- estimated price of the same model/year/km, filled by a nightly job
  body_type    text not null check (body_type in ('sedan','hatch','suv','pickup','van')),
  fuel         text not null,
  gear         text not null,
  province     text not null,                       -- province slug, see src/lib/provinces.ts
  -- URL slugs, kept in sync with slugify() in src/lib/seo.ts
  brand_slug   text generated always as (trim(both '-' from regexp_replace(lower(brand), '[^a-z0-9ก-๙]+', '-', 'g'))) stored,
  model_slug   text generated always as (trim(both '-' from regexp_replace(lower(model), '[^a-z0-9ก-๙]+', '-', 'g'))) stored,
  color        text not null default '#d8dbe0',
  inspected    boolean not null default false,
  -- payment terms chosen by the seller
  pay_cash     boolean not null default true,
  pay_finance  boolean not null default true,
  pay_inhouse  boolean not null default false,
  pay_free_down boolean not null default false,
  pay_down     integer,
  pay_monthly  integer,
  pay_months   smallint,
  pay_rate     numeric(5,2),
  -- lifecycle
  status       text not null default 'active' check (status in ('active','sold','expired','hidden')),
  posted_at    timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '60 days',
  sold_at      timestamptz,
  updated_at   timestamptz not null default now(),
  constraint pay_needs_a_method check (pay_finance or pay_inhouse or not pay_free_down)
);
create index listings_browse_idx on public.listings (status, cond, brand_slug, model_slug, province);
create index listings_body_idx on public.listings (status, cond, body_type, province);
create index listings_owner_idx on public.listings (owner_id);
create index listings_price_idx on public.listings (status, price);

create table public.listing_photos (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  r2_key      text not null,              -- e.g. listings/<short_id>/01.webp
  alt         text not null default '',
  position    smallint not null default 0
);
create index listing_photos_idx on public.listing_photos (listing_id, position);

-- contact details live apart from listings so they are never sent with public pages
create table public.listing_contacts (
  listing_id  uuid primary key references public.listings(id) on delete cascade,
  phone       text,
  line_id     text
);

-- ---------- promotion ----------
create table public.promotions (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  kind        text not null check (kind in ('bump','feature','home')),
  starts_at   timestamptz not null default now(),
  ends_at     timestamptz not null,
  credits_paid integer not null default 0
);
create index promotions_active_idx on public.promotions (listing_id, ends_at);

-- ---------- buyer activity ----------
create table public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, listing_id)
);

create table public.listing_events (
  id          bigint generated always as identity primary key,
  listing_id  uuid not null references public.listings(id) on delete cascade,
  kind        text not null check (kind in ('view','save','contact','visit_request')),
  created_at  timestamptz not null default now()
);
create index listing_events_idx on public.listing_events (listing_id, kind);

-- guest contact limit: one row per visitor (hashed IP) per listing per day
create table public.contact_reveals (
  day         date not null default (now() at time zone 'Asia/Bangkok')::date,
  visitor     text not null,              -- sha256(ip + salt) or 'u:<user id>'
  listing_id  uuid not null references public.listings(id) on delete cascade,
  primary key (day, visitor, listing_id)
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  listing_id  uuid not null references public.listings(id) on delete cascade,
  reason      text not null,
  detail      text,
  reporter_id uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  resolved    boolean not null default false
);

-- ---------- public view used by pages and sitemap ----------
create view public.listing_cards with (security_invoker = on) as
select l.*,
  (select r2_key from public.listing_photos p where p.listing_id = l.id order by position limit 1) as cover_key,
  (select coalesce(json_agg(json_build_object('key', p.r2_key, 'alt', p.alt) order by p.position), '[]')
     from public.listing_photos p where p.listing_id = l.id) as photos,
  (select json_build_object('kind', pr.kind, 'ends_at', pr.ends_at) from public.promotions pr
     where pr.listing_id = l.id and pr.ends_at > now() order by pr.ends_at desc limit 1) as promo,
  pf.display_name as seller_name, pf.seller_type, pf.verified as seller_verified, pf.shop_name, pf.shop_slug
from public.listings l
join public.profiles pf on pf.id = l.owner_id
where l.status in ('active','sold');

-- expire old listings (schedule daily with pg_cron or a Cloudflare cron trigger)
create or replace function public.expire_listings() returns void language sql as $$
  update public.listings set status = 'expired', updated_at = now()
  where status = 'active' and expires_at < now();
$$;

-- ---------- row level security ----------
alter table public.profiles         enable row level security;
alter table public.listings         enable row level security;
alter table public.listing_photos   enable row level security;
alter table public.listing_contacts enable row level security;
alter table public.promotions       enable row level security;
alter table public.favorites        enable row level security;
alter table public.listing_events   enable row level security;
alter table public.contact_reveals  enable row level security;
alter table public.reports          enable row level security;

-- profiles: public can read the seller-facing fields through the view; owners manage their own row
create policy "profiles readable" on public.profiles for select using (true);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id);
-- verified / plan / credits are changed only by the service role (admin, payment webhook).
-- Supabase grants table-wide UPDATE to `authenticated`, so a column REVOKE has no effect; a trigger enforces it.
create or replace function public.guard_profile_admin_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.verified := false; new.plan := 'free'; new.plan_until := null; new.credits := 0;
    else
      new.verified := old.verified; new.plan := old.plan; new.plan_until := old.plan_until; new.credits := old.credits;
    end if;
  end if;
  return new;
end $$;
create trigger profiles_guard before insert or update on public.profiles
  for each row execute function public.guard_profile_admin_fields();

-- sellers cannot mark their own car as inspected, set the market price, or extend expiry beyond 60 days
create or replace function public.guard_listing_admin_fields() returns trigger
language plpgsql set search_path = '' as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
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
create trigger listings_guard before insert or update on public.listings
  for each row execute function public.guard_listing_admin_fields();

-- listings: anyone reads active or sold; owners read/write their own
create policy "listings public read" on public.listings for select
  using (status in ('active','sold') or owner_id = auth.uid());
create policy "listings owner insert" on public.listings for insert with check (owner_id = auth.uid());
create policy "listings owner update" on public.listings for update using (owner_id = auth.uid())
  with check (owner_id = auth.uid());
create policy "listings owner delete" on public.listings for delete using (owner_id = auth.uid());

create policy "photos public read" on public.listing_photos for select using (true);
create policy "photos owner write" on public.listing_photos for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));

-- contacts: only the owner reads directly; buyers get them through /api/reveal (service role, rate limited)
create policy "contacts owner" on public.listing_contacts for all
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()))
  with check (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));

-- promotions: public read (to sort and label ads); writes only by service role after payment/credits
create policy "promotions public read" on public.promotions for select using (true);

create policy "favorites own" on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- events: anyone may insert; owners read events of their own listings (seller dashboard)
create policy "events insert" on public.listing_events for insert with check (true);
create policy "events owner read" on public.listing_events for select
  using (exists (select 1 from public.listings l where l.id = listing_id and l.owner_id = auth.uid()));

create policy "reports insert" on public.reports for insert with check (true);
-- contact_reveals: no policies, service role only
