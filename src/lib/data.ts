import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BodyType, Cond, Listing } from "./types";
import { SEED } from "./seed";
import { slugify } from "./seo";

const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const IMG = (process.env.NEXT_PUBLIC_IMG_URL || "https://img.tops-car.com").replace(/\/$/, "");

/** True once Supabase keys are set; until then the site runs on sample data. */
export const hasDb = Boolean(URL_ && ANON);
let client: SupabaseClient | null = null;
const db = () => (client ??= createClient(URL_!, ANON!, { auth: { persistSession: false } }));

export type Filter = {
  cond?: Cond;
  brandSlug?: string;
  modelSlug?: string;
  provinces?: string[];
  body?: BodyType[];
  maxPrice?: number;
  minYear?: number;
  includeSold?: boolean;
  limit?: number;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function fromRow(r: any): Listing {
  const promo = r.promo ? { kind: r.promo.kind, endsAt: r.promo.ends_at } : null;
  return {
    id: r.short_id, cond: r.cond, brand: r.brand, model: r.model, trim: r.trim_name, year: r.year, km: r.km,
    price: r.price, mkt: r.market_price ?? null, body: r.body_type, fuel: r.fuel, gear: r.gear, province: r.province,
    color: r.color, inspected: r.inspected, status: r.status, postedAt: r.posted_at, promo,
    pay: { cash: r.pay_cash, finance: r.pay_finance, inhouse: r.pay_inhouse, freeDown: r.pay_free_down,
      down: r.pay_down, monthly: r.pay_monthly, months: r.pay_months, rate: r.pay_rate === null ? null : Number(r.pay_rate) },
    photos: (r.photos || []).map((p: any) => ({ url: `${IMG}/${p.key}`, alt: p.alt })),
    seller: { name: r.seller_name, type: r.seller_type, verified: r.seller_verified, shopName: r.shop_name },
  };
}

const promoWeight = (l: Listing) =>
  l.promo && new Date(l.promo.endsAt) > new Date() ? { home: 3, feature: 2, bump: 1 }[l.promo.kind] : 0;

/** Paid placements first (always labelled on the card), then newest. */
export const sortForBrowse = (a: Listing, b: Listing) =>
  promoWeight(b) - promoWeight(a) || +new Date(b.postedAt) - +new Date(a.postedAt);

export async function findListings(f: Filter = {}): Promise<Listing[]> {
  if (!hasDb) {
    return SEED.filter((l) =>
      (f.includeSold || l.status === "active") &&
      (!f.cond || l.cond === f.cond) &&
      (!f.brandSlug || slugify(l.brand) === f.brandSlug) &&
      (!f.modelSlug || slugify(l.model) === f.modelSlug) &&
      (!f.provinces || f.provinces.includes(l.province)) &&
      (!f.body || f.body.includes(l.body)) &&
      (!f.maxPrice || l.price <= f.maxPrice) &&
      (!f.minYear || l.year >= f.minYear),
    ).sort(sortForBrowse).slice(0, f.limit ?? 500);
  }
  let q = db().from("listing_cards").select("*").limit(f.limit ?? 500);
  q = f.includeSold ? q.in("status", ["active", "sold"]) : q.eq("status", "active");
  if (f.cond) q = q.eq("cond", f.cond);
  if (f.brandSlug) q = q.eq("brand_slug", f.brandSlug);
  if (f.modelSlug) q = q.eq("model_slug", f.modelSlug);
  if (f.provinces) q = q.in("province", f.provinces);
  if (f.body) q = q.in("body_type", f.body);
  if (f.maxPrice) q = q.lte("price", f.maxPrice);
  if (f.minYear) q = q.gte("year", f.minYear);
  const { data, error } = await q.order("posted_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(fromRow).sort(sortForBrowse);
}

export async function getListing(shortId: string): Promise<Listing | null> {
  if (!hasDb) return SEED.find((l) => l.id === shortId) ?? null;
  const { data, error } = await db().from("listing_cards").select("*").eq("short_id", shortId).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

/** Similar cars for a listing page (and for "ขายแล้ว" pages, so visitors stay on the site). */
export async function similar(l: Listing, n = 6): Promise<Listing[]> {
  const pool = await findListings({ cond: l.cond, body: [l.body], limit: 60 });
  return pool
    .filter((x) => x.id !== l.id)
    .sort((a, b) => Math.abs(a.price - l.price) - Math.abs(b.price - l.price))
    .slice(0, n);
}
