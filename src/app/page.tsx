import Link from "next/link";
import { findListings } from "@/lib/data";
import { CarGrid } from "@/components/CarCard";
import { HubLinks } from "@/components/Seo";

export const dynamic = "force-dynamic";

const TRY = ["รถตู้ มือสอง ใกล้อยุธยา", "ฟรีดาวน์ ผ่อนไม่เกิน 9 พัน", "กระบะ ดาวน์ไม่เกิน 1 แสน", "ผ่อนกับร้าน"];

export default async function Home() {
  const all = await findListings({ limit: 500 });
  return (
    <main>
      <section className="lane">
        <div className="wrap">
          <h1>รถใหม่ป้ายแดงและรถมือสอง พิมพ์หาเหมือนคุยกัน</h1>
          <form className="ask" action="/search" role="search">
            <input name="q" type="search" placeholder="เช่น กระบะ งบ 9 แสน ใกล้อยุธยา" aria-label="ค้นหารถ" />
            <button>ค้นหา</button>
          </form>
          <div className="try">ลองพิมพ์: {TRY.map((t) => <Link key={t} href={`/search?q=${encodeURIComponent(t)}`}>{t}</Link>)}</div>
        </div>
        <div className="dash" />
      </section>
      <div className="wrap">
        <section className="section">
          <h2>รถเข้าใหม่</h2>
          <CarGrid items={all.slice(0, 12)} />
          <p style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link className="primary" href="/used-cars">ดูรถมือสองทั้งหมด</Link>
            <Link className="primary" href="/new-cars">ดูรถใหม่ป้ายแดงทั้งหมด</Link>
          </p>
        </section>
        <HubLinks items={all} />
      </div>
    </main>
  );
}
