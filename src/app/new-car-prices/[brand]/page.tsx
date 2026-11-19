import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BODY_TH } from "@/lib/types";
import { baht } from "@/lib/money";
import { abs, BRAND, hubPath } from "@/lib/seo";
import { brandBySlug, CATALOG, CATALOG_AS_OF, catalogPath, priceText } from "@/lib/catalog";
import { findListings } from "@/lib/data";
import { CarGrid } from "@/components/CarCard";
import { Crumbs, JsonLd } from "@/components/Seo";

export const dynamic = "force-dynamic";
type P = { brand: string };

export const generateMetadata = async ({ params }: { params: Promise<P> }): Promise<Metadata> => {
  const b = brandBySlug((await params).brand);
  if (!b) return {};
  const lo = b.models[0].from;
  return {
    title: `ราคา ${b.name} ทุกรุ่น ${CATALOG_AS_OF} เริ่มต้น ${baht(lo)} บาท`,
    description: `ราคารถใหม่ ${b.name} ${b.models.length} รุ่น เริ่มต้น ${baht(lo)} บาท ${b.models.slice(0, 5).map((m) => m.model).join(" ")} เทียบราคา คำนวณค่างวด และดูรถ ${b.name} ที่ลงขายจริงใน ${BRAND}`,
    alternates: { canonical: catalogPath(b.name) },
  };
};

export const generateStaticParams = () => CATALOG.map((b) => ({ brand: b.slug }));

export default async function Page({ params }: { params: Promise<P> }) {
  const b = brandBySlug((await params).brand);
  if (!b) notFound();
  const crumbs = [{ name: "หน้าแรก", path: "/" }, { name: "ราคารถใหม่", path: "/new-car-prices" }, { name: b.name, path: catalogPath(b.name) }];
  const listings = await findListings({ cond: "new", brandSlug: b.slug, limit: 12 });
  return (
    <main className="wrap section">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })) },
          { "@type": "ItemList", itemListElement: b.models.map((m, i) => ({ "@type": "ListItem", position: i + 1, name: `${b.name} ${m.model}`, url: abs(catalogPath(b.name, m.model)) })) },
        ],
      }} />
      <Crumbs items={crumbs} />
      <h1 className="page-h1">ราคา {b.name} ทุกรุ่น</h1>
      <p className="note" style={{ maxWidth: "70ch" }}>
        {b.name} {b.models.length} รุ่น ราคาแนะนำเริ่มต้น {baht(b.models[0].from)} บาท ข้อมูล{CATALOG_AS_OF} ราคาอ้างอิงจากสื่อยานยนต์ ไม่ใช่ใบเสนอราคา สอบถามราคาจริงกับตัวแทนจำหน่าย
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="pricetable">
          <thead><tr><th>รุ่น</th><th>ประเภท</th><th>เครื่องยนต์</th><th>ราคาแนะนำ</th></tr></thead>
          <tbody>
            {b.models.map((m) => (
              <tr key={m.model}>
                <td><Link href={catalogPath(b.name, m.model)}>{b.name} {m.model}</Link></td>
                <td>{BODY_TH[m.body]}</td>
                <td>{m.fuel || "-"}</td>
                <td>{priceText(m, baht)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section style={{ marginTop: 28 }}>
        <h2>{b.name} ป้ายแดงที่ตัวแทนจำหน่ายลงขาย</h2>
        <CarGrid items={listings} empty={`ยังไม่มีตัวแทนจำหน่าย ${b.name} ลงขายในตอนนี้ เป็นตัวแทนจำหน่ายหรือเต็นท์รถ? ลงประกาศฟรีได้เลย`} />
        <p><Link href={hubPath({ cond: "new", brand: b.name })}>ดูรถใหม่ {b.name} ทั้งหมด</Link> · <Link className="primary" href="/sell">ลงประกาศขายฟรี</Link></p>
      </section>

      <p style={{ marginTop: 24 }}><Link href="/new-car-prices">← ราคารถใหม่ทุกยี่ห้อ</Link></p>
    </main>
  );
}
