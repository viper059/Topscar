import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import type { BodyType, Listing } from "@/lib/types";
import { BODY_TH, SELLER_TH } from "@/lib/types";
import { findListings, getListing, similar } from "@/lib/data";
import { PROVINCES, provName } from "@/lib/provinces";
import { baht, canFinance, deal, defaultRate, downOf } from "@/lib/money";
import {
  breadcrumbs, hubDescription, hubJsonLd, hubPath, hubTitle, listingDescription, listingJsonLd, listingPath,
  listingTitle, SLUG_COND, slugify, type Hub,
} from "@/lib/seo";
import { CarGrid, PayTags, Plate } from "@/components/CarCard";
import CarArt from "@/components/CarArt";
import { Crumbs, HubLinks, JsonLd } from "@/components/Seo";
import LoanCalc from "@/components/LoanCalc";
import ContactBox from "@/components/ContactBox";
import ViewBeacon from "@/components/ViewBeacon";

export const dynamic = "force-dynamic";

type Params = { cond: string; rest?: string[] };
type Resolved =
  | { kind: "hub"; hub: Hub; items: Listing[] }
  | { kind: "listing"; listing: Listing; hub: Hub };

const BODIES = Object.keys(BODY_TH) as BodyType[];

/**
 * URL map (all lowercase, English slugs so links stay short when shared in LINE):
 *   /used-cars                              all used cars
 *   /used-cars/in/ayutthaya                 by province
 *   /used-cars/type/van[/ayutthaya]         by body type (+ province)
 *   /used-cars/toyota[/commuter[/ayutthaya]] by brand, model, province
 *   /used-cars/toyota/commuter/ayutthaya/2018-j6b5n7   one listing
 */
const resolve = cache(async ({ cond: condSlug, rest = [] }: Params): Promise<Resolved | null> => {
  const cond = SLUG_COND[condSlug];
  if (!cond) return null;
  const [a, b, c, d] = rest;

  if (rest.length === 0) return { kind: "hub", hub: { cond }, items: await findListings({ cond }) };
  if (a === "in") {
    if (rest.length !== 2 || !PROVINCES[b]) return null;
    return { kind: "hub", hub: { cond, province: b }, items: await findListings({ cond, provinces: [b] }) };
  }
  if (a === "type") {
    if (!BODIES.includes(b as BodyType) || rest.length > 3 || (c && !PROVINCES[c])) return null;
    const body = b as BodyType;
    return { kind: "hub", hub: { cond, body, province: c }, items: await findListings({ cond, body: [body], provinces: c ? [c] : undefined }) };
  }
  if (rest.length === 4) {
    const m = /^(\d{4})-([a-z0-9]+)$/.exec(d);
    if (!m) return null;
    const listing = await getListing(m[2]);
    if (!listing) return null;
    if (listingPath(listing) !== `/${condSlug}/${rest.join("/")}`) permanentRedirect(listingPath(listing));
    return { kind: "listing", listing, hub: { cond, brand: listing.brand, model: listing.model, province: listing.province } };
  }
  if (rest.length > 3 || (c && !PROVINCES[c])) return null;

  // brand / model hubs: names come from the listings themselves; unknown slugs are 404 (no thin pages)
  const known = await findListings({ cond, brandSlug: a, modelSlug: b, includeSold: true, limit: 1 });
  if (!known.length) return null;
  const hub: Hub = { cond, brand: known[0].brand, model: b ? known[0].model : undefined, province: c };
  return { kind: "hub", hub, items: await findListings({ cond, brandSlug: a, modelSlug: b, provinces: c ? [c] : undefined }) };
});

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const r = await resolve(await params);
  if (!r) return {};
  if (r.kind === "listing") {
    const l = r.listing, path = listingPath(l), title = listingTitle(l), description = listingDescription(l);
    const images = l.photos.slice(0, 1).map((p) => ({ url: p.url, width: 1200, height: 750, alt: p.alt || title }));
    return {
      title, description,
      alternates: { canonical: path },
      openGraph: { title, description, url: path, type: "website", images },
      twitter: { card: images.length ? "summary_large_image" : "summary", title, description },
    };
  }
  const path = hubPath(r.hub), title = hubTitle(r.hub, r.items.length), description = hubDescription(r.hub, r.items);
  return {
    title, description,
    alternates: { canonical: path },
    // empty category pages exist for navigation but are kept out of Google until they have cars
    robots: r.items.length ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: path, type: "website" },
  };
}

export default async function Page({ params }: { params: Promise<Params> }) {
  const r = await resolve(await params);
  if (!r) notFound();
  return r.kind === "listing" ? <ListingPage l={r.listing} hub={r.hub} /> : <HubPage hub={r.hub} items={r.items} />;
}

/* ---------------- hub (category) page ---------------- */
async function HubPage({ hub, items }: { hub: Hub; items: Listing[] }) {
  const crumbs = breadcrumbs(hub);
  const related = hub.brand || hub.body || hub.province ? await findListings({ cond: hub.cond, limit: 300 }) : items;
  return (
    <main className="wrap">
      <JsonLd data={hubJsonLd(items, crumbs)} />
      <section className="section">
        <Crumbs items={crumbs} />
        <h1 className="page-h1">{hubTitle(hub, items.length)}</h1>
        <p className="note" style={{ maxWidth: "65ch", marginBottom: 16 }}>{hubDescription(hub, items)}</p>
        <CarGrid items={items} empty="ยังไม่มีรถในหมวดนี้ ลองดูหมวดใกล้เคียงด้านล่าง หรือลงประกาศขายรถของคุณฟรี" />
      </section>
      <HubLinks items={related} title="หมวดที่เกี่ยวข้อง" />
    </main>
  );
}

/* ---------------- listing page ---------------- */
function PayBox({ l }: { l: Listing }) {
  const p = l.pay;
  const terms = [
    p.freeDown ? "ไม่ต้องดาวน์" : p.down ? `ดาวน์ ฿${baht(p.down)}` : "",
    p.monthly ? `ผ่อน ฿${baht(p.monthly)}/เดือน` : "",
    p.months ? `${p.months} งวด` : "",
    p.rate != null ? `ดอกเบี้ย ${p.rate}% ต่อปี` : "",
  ].filter(Boolean);
  const li = (ok: boolean, t: string) => <li className={ok ? "yes" : "no"}>{t}</li>;
  return (
    <div className="box payterms">
      <h2>เงื่อนไขการชำระเงินจากร้าน</h2>
      <ul>
        {li(true, "เงินสดหรือโอนเต็มจำนวน")}
        {li(p.finance, "ผ่อนผ่านไฟแนนซ์")}
        {li(p.inhouse, "ผ่อนกับร้านโดยตรง (ไม่ผ่านไฟแนนซ์)")}
        {li(p.freeDown, "ฟรีดาวน์")}
      </ul>
      {canFinance(l) && terms.length > 0 && <div className="tag">ร้านแจ้ง: {terms.join(" · ")}</div>}
      {p.inhouse && <p className="note">ผ่อนกับร้าน: ทำสัญญากับร้านโดยตรง ควรขอดูสัญญา เงื่อนไขยึดรถ และการโอนเล่มทะเบียนก่อนตกลง</p>}
    </div>
  );
}

async function ListingPage({ l, hub }: { l: Listing; hub: Hub }) {
  const crumbs = breadcrumbs(hub, { name: `${l.year} ${l.model}`, path: listingPath(l) });
  const d = deal(l);
  const more = await similar(l);
  const sold = l.status === "sold";
  return (
    <main className="wrap">
      <JsonLd data={listingJsonLd(l, crumbs)} />
      {!sold && <ViewBeacon listingId={l.id} />}
      <section className="section">
        <Crumbs items={crumbs} />
        <h1 className="page-h1">{l.brand} {l.model} {l.trim} ปี {l.year} {l.cond === "new" ? "ป้ายแดง" : "มือสอง"}</h1>
        <div className="detail" style={{ marginTop: 12 }}>
          <div style={{ display: "grid", gap: 16, minWidth: 0 }}>
            <div className="gallery" aria-label="รูปรถ">
              {l.photos.length
                ? l.photos.map((p, i) => <img key={p.url} src={p.url} alt={p.alt || `${l.brand} ${l.model} ${l.year} รูปที่ ${i + 1}`} loading={i ? "lazy" : "eager"} width={1200} height={750} />)
                : <div style={{ padding: 24 }}><Plate l={l} /><CarArt l={l} /></div>}
            </div>
            <div>
              <div className="pricerow"><span className="price num big">฿{baht(l.price)}</span>{d && <span className={`deal ${d.kind}`}>{d.label}</span>}</div>
              {d && l.mkt && <p className="note">ราคากลางรถแบบเดียวกันประมาณ ฿{baht(l.mkt)} คันนี้{d.ratio < 1 ? "ถูกกว่า" : "แพงกว่า"} {Math.abs(Math.round((d.ratio - 1) * 100))}%</p>}
              <div style={{ marginTop: 8 }}><PayTags l={l} /></div>
            </div>
            <div className="box">
              <h2>ข้อมูลรถ</h2>
              <dl className="dl">
                <dt>สภาพ</dt><dd>{l.cond === "new" ? "รถใหม่ป้ายแดง" : "รถมือสอง"}</dd>
                <dt>ปีรถ</dt><dd className="num">{l.year}</dd>
                <dt>เลขไมล์</dt><dd className="num">{baht(l.km)} กม.</dd>
                <dt>ประเภท</dt><dd>{BODY_TH[l.body]}</dd>
                <dt>เชื้อเพลิง</dt><dd>{l.fuel}</dd>
                <dt>เกียร์</dt><dd>{l.gear}</dd>
                <dt>ที่ตั้งรถ</dt><dd>{provName(l.province)}</dd>
                <dt>ผู้ขาย</dt><dd>{l.seller.shopName || l.seller.name} · {SELLER_TH[l.seller.type]} {l.seller.verified ? <span style={{ color: "var(--ok)" }}>✓ ยืนยันตัวตนแล้ว</span> : <span className="note">ยังไม่ยืนยันตัวตน</span>}</dd>
                <dt>ตรวจสภาพ</dt><dd>{l.inspected ? <span style={{ color: "var(--ok)" }}>ผ่านการตรวจแล้ว</span> : "ยังไม่ได้ตรวจ"}</dd>
                <dt>ลงประกาศ</dt><dd>{new Date(l.postedAt).toLocaleDateString("th-TH", { day: "numeric", month: "long", year: "numeric" })}</dd>
              </dl>
            </div>
          </div>
          <aside style={{ display: "grid", gap: 16, alignContent: "start", minWidth: 0 }}>
            <ContactBox listingId={l.id} sold={sold} />
            <PayBox l={l} />
            {!sold && canFinance(l) && (
              <LoanCalc price={l.price} downPct={(downOf(l) / l.price) * 100} years={Math.round((l.pay.months || 60) / 12)} rate={l.pay.rate ?? defaultRate(l)} fromShop={Boolean(l.pay.monthly)} />
            )}
          </aside>
        </div>
      </section>
      <section className="section">
        <h2>{sold ? "รถคล้ายกันที่ยังขายอยู่" : "รถที่คล้ายกัน"}</h2>
        <CarGrid items={more} />
      </section>
    </main>
  );
}
