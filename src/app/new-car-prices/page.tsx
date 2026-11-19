import type { Metadata } from "next";
import Link from "next/link";
import { BODY_TH } from "@/lib/types";
import { baht } from "@/lib/money";
import { abs, BRAND } from "@/lib/seo";
import { CATALOG, CATALOG_AS_OF, CATALOG_SOURCES, catalogCount, catalogPath, priceText } from "@/lib/catalog";
import { Crumbs, JsonLd } from "@/components/Seo";

const TITLE = `ราคารถใหม่ ทุกยี่ห้อ ${CATALOG_AS_OF} เทียบราคา ตารางผ่อน`;
const DESC = `รวมราคารถใหม่ป้ายแดง ${CATALOG.length} ยี่ห้อ ${catalogCount()} รุ่น Toyota Honda Isuzu Mitsubishi Nissan Mazda MG BYD และอื่นๆ เทียบราคาและคำนวณค่างวดได้ทันที ดูรถใหม่ที่ตัวแทนจำหน่ายลงขายจริงได้ที่ ${BRAND}`;

export const metadata: Metadata = { title: TITLE, description: DESC, alternates: { canonical: "/new-car-prices" } };

const BUDGETS = [500_000, 700_000, 1_000_000, 1_500_000];

export default function Page() {
  const crumbs = [{ name: "หน้าแรก", path: "/" }, { name: "ราคารถใหม่", path: "/new-car-prices" }];
  const all = CATALOG.flatMap((b) => b.models);
  return (
    <main className="wrap section">
      <JsonLd data={{
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "BreadcrumbList", itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: abs(c.path) })) },
          { "@type": "ItemList", itemListElement: CATALOG.map((b, i) => ({ "@type": "ListItem", position: i + 1, name: `ราคา ${b.name}`, url: abs(catalogPath(b.name)) })) },
        ],
      }} />
      <Crumbs items={crumbs} />
      <h1 className="page-h1">ราคารถใหม่ทุกยี่ห้อ</h1>
      <p className="note" style={{ maxWidth: "70ch" }}>
        ราคาแนะนำของรถป้ายแดง {catalogCount()} รุ่นจาก {CATALOG.length} ยี่ห้อ ข้อมูล{CATALOG_AS_OF} ราคาอ้างอิงจากสื่อยานยนต์ ไม่ใช่ใบเสนอราคา
        ราคาจริงขึ้นกับรุ่นย่อย โปรโมชัน และตัวแทนจำหน่าย ควรสอบถามกับตัวแทนจำหน่ายก่อนตัดสินใจ
      </p>

      <h2>ดูตามงบ</h2>
      <ul className="chips">
        {BUDGETS.map((b) => {
          const n = all.filter((m) => m.from <= b).length;
          return <li key={b}><a href={`#budget-${b}`}>ไม่เกิน {baht(b)} บาท ({n} รุ่น)</a></li>;
        })}
      </ul>

      <h2>ดูตามยี่ห้อ</h2>
      <div className="grid">
        {CATALOG.map((b) => (
          <Link key={b.slug} href={catalogPath(b.name)} className="box">
            <h3>{b.name}</h3>
            <div className="note">{b.models.length} รุ่น เริ่มต้น {baht(b.models[0].from)} บาท</div>
          </Link>
        ))}
      </div>

      {BUDGETS.map((budget, i) => {
        const lo = i ? BUDGETS[i - 1] : 0;
        const list = all.filter((m) => m.from <= budget && m.from > lo).sort((a, b) => a.from - b.from);
        if (!list.length) return null;
        return (
          <section key={budget} id={`budget-${budget}`} style={{ marginTop: 24 }}>
            <h2>รถใหม่ราคา{lo ? ` ${baht(lo)} -` : "ไม่เกิน"} {baht(budget)} บาท</h2>
            <ul style={{ display: "grid", gap: 6, paddingLeft: 18 }}>
              {list.map((m) => (
                <li key={`${m.brand}-${m.model}`}>
                  <Link href={catalogPath(m.brand, m.model)}>{m.brand} {m.model}</Link>{" "}
                  <span className="note">{BODY_TH[m.body]} · {priceText(m, baht)}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="note" style={{ marginTop: 24 }}>
        แหล่งข้อมูลราคา: {CATALOG_SOURCES.map((s, i) => <span key={s.url}>{i ? " · " : ""}<a href={s.url} rel="nofollow noopener" target="_blank">{s.name}</a></span>)}
        {" "}ยังไม่ครบทุกยี่ห้อและทุกรุ่น รถหรูบางยี่ห้อกำลังเพิ่ม ถ้าพบราคาไม่ตรง แจ้งได้ที่หน้า<Link href="/terms">ข้อตกลง</Link>
      </p>
    </main>
  );
}
