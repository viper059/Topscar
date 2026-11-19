import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BODY_TH } from "@/lib/types";
import { baht } from "@/lib/money";
import { abs, BRAND, hubPath, slugify } from "@/lib/seo";
import { brandBySlug, CATALOG, CATALOG_AS_OF, catalogPath, modelBySlug, modelSlug, priceText } from "@/lib/catalog";
import { findListings } from "@/lib/data";
import { CarGrid } from "@/components/CarCard";
import { Crumbs, JsonLd } from "@/components/Seo";
import LoanCalc from "@/components/LoanCalc";

export const dynamic = "force-dynamic";
type P = { brand: string; model: string };

const find = async (p: Promise<P>) => {
  const { brand, model } = await p;
  const b = brandBySlug(brand);
  const m = b && modelBySlug(b, model);
  return b && m ? { b, m } : null;
};

export const generateMetadata = async ({ params }: { params: Promise<P> }): Promise<Metadata> => {
  const f = await find(params);
  if (!f) return {};
  const { b, m } = f;
  return {
    title: `ราคา ${b.name} ${m.model} ${CATALOG_AS_OF} ${priceText(m, baht)} ตารางผ่อน`,
    description: `ราคา ${b.name} ${m.model} ${BODY_TH[m.body]}${m.fuel ? ` ${m.fuel}` : ""} ${priceText(m, baht)} คำนวณค่างวด เงินดาวน์ และดูรถ ${b.name} ${m.model} ป้ายแดงที่ลงขายจริงใน ${BRAND}`,
    alternates: { canonical: catalogPath(b.name, m.model) },
  };
};

export const generateStaticParams = () => CATALOG.flatMap((b) => b.models.map((m) => ({ brand: b.slug, model: modelSlug(m) })));

export default async function Page({ params }: { params: Promise<P> }) {
  const f = await find(params);
  if (!f) notFound();
  const { b, m } = f;
  const crumbs = [
    { name: "หน้าแรก", path: "/" }, { name: "ราคารถใหม่", path: "/new-car-prices" },
    { name: b.name, path: catalogPath(b.name) }, { name: m.model, path: catalogPath(b.name, m.model) },
  ];
  const ms = modelSlug(m);
  const listings = (await findListings({ cond: "new", brandSlug: b.slug, limit: 60 }))
    .filter((l) => { const s = slugify(l.model); return s === ms || s.startsWith(`${ms}-`); })
    .slice(0, 12);
  const rivals = CATALOG.flatMap((x) => x.models)
    .filter((x) => x.body === m.body && !(x.brand === m.brand && x.model === m.model))
    .sort((p, q) => Math.abs(p.from - m.from) - Math.abs(q.from - m.from))
    .slice(0, 6);
  return (
    <main className="wrap section">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })) },
          { "@type": "Car", name: `${b.name} ${m.model}`, brand: { "@type": "Brand", name: b.name }, model: m.model, bodyType: BODY_TH[m.body], ...(m.fuel ? { fuelType: m.fuel } : {}), itemCondition: "https://schema.org/NewCondition", url: abs(catalogPath(b.name, m.model)) },
        ],
      }} />
      <Crumbs items={crumbs} />
      <h1 className="page-h1">ราคา {b.name} {m.model}</h1>
      <p style={{ fontSize: 22, fontWeight: 700, margin: "4px 0" }}>{priceText(m, baht)}</p>
      <p className="note" style={{ maxWidth: "70ch" }}>
        {BODY_TH[m.body]}{m.fuel ? ` · ${m.fuel}` : ""} ราคาแนะนำ{CATALOG_AS_OF} อ้างอิงจากสื่อยานยนต์ ไม่ใช่ใบเสนอราคา ราคาจริงขึ้นกับรุ่นย่อยและโปรโมชันของตัวแทนจำหน่าย
      </p>

      <div style={{ maxWidth: 520, margin: "16px 0" }}>
        <LoanCalc price={m.from} downPct={25} years={5} rate={2.49} fromShop={false} cond="new" />
        <p className="note">คำนวณจากราคาเริ่มต้นของรุ่น {baht(m.from)} บาท ปรับเงินดาวน์ ระยะผ่อน และดอกเบี้ยเองได้</p>
      </div>

      <section>
        <h2>{b.name} {m.model} ป้ายแดงที่ตัวแทนจำหน่ายลงขาย</h2>
        <CarGrid items={listings} empty={`ยังไม่มีประกาศ ${b.name} ${m.model} ป้ายแดงในตอนนี้ เป็นตัวแทนจำหน่ายหรือเต็นท์รถ? ลงประกาศฟรีได้เลย`} />
        <p><Link href={hubPath({ cond: "new", brand: b.name, model: m.model })}>ดูประกาศ {b.name} {m.model} ทั้งหมด</Link> · <Link className="primary" href="/sell">ลงประกาศขายฟรี</Link></p>
      </section>

      {rivals.length > 0 && (
        <section style={{ marginTop: 24 }}>
          <h2>รุ่นใกล้เคียงที่น่าเทียบ</h2>
          <ul style={{ display: "grid", gap: 6, paddingLeft: 18 }}>
            {rivals.map((x) => (
              <li key={`${x.brand}-${x.model}`}><Link href={catalogPath(x.brand, x.model)}>{x.brand} {x.model}</Link> <span className="note">{priceText(x, baht)}</span></li>
            ))}
          </ul>
        </section>
      )}
      <p style={{ marginTop: 24 }}><Link href={catalogPath(b.name)}>← ราคา {b.name} ทุกรุ่น</Link></p>
    </main>
  );
}
