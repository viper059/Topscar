import type { BodyType, Cond, Listing } from "./types";
import { BODY_TH } from "./types";
import { provName, provShort, PROVINCES } from "./provinces";
import { baht, canFinance, monthlyOf } from "./money";

export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://tops-car.com").replace(/\/$/, "");
export const BRAND = "Tops Car";

export const COND_SLUG: Record<Cond, string> = { used: "used-cars", new: "new-cars" };
export const SLUG_COND: Record<string, Cond> = { "used-cars": "used", "new-cars": "new" };
const COND_TH: Record<Cond, string> = { used: "มือสอง", new: "ป้ายแดง" };
const BODY_SHORT: Record<BodyType, string> = { sedan: "รถเก๋ง", hatch: "รถแฮทช์แบ็ก", suv: "รถ SUV", pickup: "รถกระบะ", van: "รถตู้" };

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9ก-๙]+/g, "-").replace(/^-+|-+$/g, "");

/* ---------- URLs ---------- */
export type Hub = { cond: Cond; brand?: string; model?: string; province?: string; body?: BodyType };

export function hubPath(h: Hub): string {
  const base = `/${COND_SLUG[h.cond]}`;
  if (h.body) return `${base}/type/${h.body}${h.province ? `/${h.province}` : ""}`;
  if (!h.brand && h.province) return `${base}/in/${h.province}`;
  const parts = [h.brand && slugify(h.brand), h.model && slugify(h.model), h.province].filter(Boolean);
  return parts.length ? `${base}/${parts.join("/")}` : base;
}

export const listingPath = (l: Listing) =>
  `${hubPath({ cond: l.cond, brand: l.brand, model: l.model, province: l.province })}/${l.year}-${l.id}`;

export const abs = (path: string) => `${SITE}${path}`;

/* ---------- listing page text ---------- */
export function listingTitle(l: Listing) {
  return `${l.brand} ${l.model} ${l.trim} ปี ${l.year} ${COND_TH[l.cond]} ${provShort(l.province)} ราคา ${baht(l.price)} บาท`;
}

export function listingDescription(l: Listing) {
  const parts = [
    `ขาย ${l.brand} ${l.model} ${l.trim} ปี ${l.year}`,
    l.cond === "used" ? `วิ่ง ${baht(l.km)} กม.` : "รถใหม่ป้ายแดง",
    `${l.fuel} เกียร์ ${l.gear}`,
    `ที่${provName(l.province)}`,
    canFinance(l) ? `${l.pay.freeDown ? "ฟรีดาวน์ " : ""}ผ่อนประมาณ ${baht(monthlyOf(l))} บาท/เดือน` : "ขายสด",
    l.inspected ? "ผ่านการตรวจสภาพ" : "",
  ];
  return parts.filter(Boolean).join(" ");
}

/* ---------- hub page text ---------- */
export function hubTitle(h: Hub, count: number) {
  const where = h.province ? ` ${provShort(h.province)}` : "";
  const n = count ? ` (${baht(count)} คัน)` : "";
  if (h.body) return `${BODY_SHORT[h.body]}${COND_TH[h.cond]}${where} ราคาล่าสุด${n}`;
  if (h.model) return `${h.brand} ${h.model} ${COND_TH[h.cond]}${where} ราคาล่าสุด${n}`;
  if (h.brand) return `${h.brand} ${COND_TH[h.cond]} ทุกรุ่น ราคาล่าสุด${n}`;
  if (h.province) return `รถ${COND_TH[h.cond]}${where} ราคาถูก${n}`;
  return h.cond === "used" ? `รถมือสอง ราคาถูก ซื้อขายรถมือสอง ลงประกาศฟรี${n}` : `รถใหม่ป้ายแดง ราคาและโปรโมชัน ตารางผ่อน${n}`;
}

export function hubDescription(h: Hub, items: Listing[]) {
  const label = hubTitle(h, 0).replace(/ ราคา.*$/, "");
  if (!items.length) return `${label} ยังไม่มีรถในหมวดนี้ ลงประกาศขายรถฟรีที่ ${BRAND}`;
  const prices = items.map((l) => l.price);
  return `${label} ${baht(items.length)} คัน ราคาเริ่มต้น ${baht(Math.min(...prices))} บาท ถึง ${baht(Math.max(...prices))} บาท ดูรูป เทียบราคากับตลาด เช็คเงื่อนไขผ่อนและฟรีดาวน์ ติดต่อผู้ขายได้โดยตรง`;
}

/* ---------- breadcrumbs ---------- */
export function breadcrumbs(h: Hub, last?: { name: string; path: string }) {
  const crumbs = [{ name: "หน้าแรก", path: "/" }, { name: `รถ${COND_TH[h.cond]}`, path: hubPath({ cond: h.cond }) }];
  if (h.body) {
    crumbs.push({ name: `${BODY_SHORT[h.body]}${COND_TH[h.cond]}`, path: hubPath({ cond: h.cond, body: h.body }) });
    if (h.province) crumbs.push({ name: provShort(h.province), path: hubPath(h) });
  } else if (h.brand) {
    crumbs.push({ name: h.brand, path: hubPath({ cond: h.cond, brand: h.brand }) });
    if (h.model) crumbs.push({ name: h.model, path: hubPath({ cond: h.cond, brand: h.brand, model: h.model }) });
    if (h.province) crumbs.push({ name: provShort(h.province), path: hubPath(h) });
  } else if (h.province) crumbs.push({ name: provShort(h.province), path: hubPath(h) });
  if (last) crumbs.push(last);
  return crumbs;
}

const breadcrumbLd = (crumbs: { name: string; path: string }[]) => ({
  "@type": "BreadcrumbList",
  itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })),
});

/* ---------- structured data ---------- */
export function listingJsonLd(l: Listing, crumbs: { name: string; path: string }[]) {
  const car = {
    "@type": "Car",
    name: `${l.brand} ${l.model} ${l.trim}`.trim(),
    brand: { "@type": "Brand", name: l.brand },
    model: l.model,
    vehicleModelDate: String(l.year),
    bodyType: BODY_TH[l.body],
    color: l.color,
    fuelType: l.fuel,
    vehicleTransmission: l.gear,
    itemCondition: l.cond === "new" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    mileageFromOdometer: { "@type": "QuantitativeValue", value: l.km, unitCode: "KMT" },
    image: l.photos.map((p) => p.url),
    description: listingDescription(l),
    url: abs(listingPath(l)),
    offers: {
      "@type": "Offer",
      price: l.price,
      priceCurrency: "THB",
      availability: l.status === "sold" ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: abs(listingPath(l)),
      seller: { "@type": l.seller.type === "private" ? "Person" : "AutoDealer", name: l.seller.shopName || l.seller.name },
      availableAtOrFrom: { "@type": "Place", address: { "@type": "PostalAddress", addressRegion: provName(l.province), addressCountry: "TH" } },
    },
  };
  return { "@context": "https://schema.org", "@graph": [car, breadcrumbLd(crumbs)] };
}

export function hubJsonLd(items: Listing[], crumbs: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumbLd(crumbs),
      {
        "@type": "ItemList",
        itemListElement: items.slice(0, 30).map((l, i) => ({ "@type": "ListItem", position: i + 1, url: abs(listingPath(l)), name: listingTitle(l) })),
      },
    ],
  };
}

/* ---------- hub discovery (for sitemap and "ค้นหายอดนิยม" links) ---------- */
export function hubsFor(items: Listing[]): Hub[] {
  const seen = new Map<string, Hub>();
  const add = (h: Hub) => seen.set(hubPath(h), h);
  for (const l of items) {
    if (!PROVINCES[l.province]) continue;
    const c = l.cond;
    add({ cond: c });
    add({ cond: c, province: l.province });
    add({ cond: c, body: l.body });
    add({ cond: c, body: l.body, province: l.province });
    add({ cond: c, brand: l.brand });
    add({ cond: c, brand: l.brand, model: l.model });
    add({ cond: c, brand: l.brand, model: l.model, province: l.province });
  }
  return [...seen.values()];
}

export function hubLabel(h: Hub) {
  return hubTitle(h, 0).replace(/ ราคา.*$/, "");
}
