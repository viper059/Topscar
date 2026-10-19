import type { Metadata } from "next";
import { findListings } from "@/lib/data";
import { askLabels, askProvinces, matchesAsk, parseAsk } from "@/lib/search";
import { CarGrid } from "@/components/CarCard";

export const dynamic = "force-dynamic";

// Search results change with every query, so they stay out of Google; hub pages carry the SEO.
export const metadata: Metadata = { title: "ค้นหารถ", robots: { index: false, follow: true } };

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q || "").slice(0, 120);
  const a = parseAsk(q);
  const pool = await findListings({ cond: a.cond, provinces: askProvinces(a), body: a.body, maxPrice: a.maxPrice, minYear: a.minYear });
  const items = pool.filter((l) => matchesAsk(l, a));
  const labels = askLabels(a);
  return (
    <main>
      <section className="lane">
        <div className="wrap">
          <form className="ask" action="/search" role="search">
            <input name="q" type="search" defaultValue={q} placeholder="เช่น กระบะ งบ 9 แสน ใกล้อยุธยา" aria-label="ค้นหารถ" />
            <button>ค้นหา</button>
          </form>
        </div>
        <div className="dash" />
      </section>
      <div className="wrap section">
        <h1 className="page-h1">พบ {items.length} คัน</h1>
        {labels.length > 0 && (
          <div className="understood">เข้าใจว่าคุณหา: {labels.map((t) => <span key={t} className="tag">{t}</span>)}</div>
        )}
        <CarGrid items={items} empty="ไม่พบรถตามที่ค้นหา ลองเพิ่มงบ เปลี่ยนจังหวัด หรือพิมพ์ให้สั้นลง" />
      </div>
    </main>
  );
}
