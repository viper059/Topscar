import Link from "next/link";
import type { Listing } from "@/lib/types";
import { baht, canFinance, deal, payLine } from "@/lib/money";
import { listingPath, listingTitle } from "@/lib/seo";
import { provShort } from "@/lib/provinces";
import CarArt from "./CarArt";

export function PayTags({ l }: { l: Listing }) {
  if (!canFinance(l)) return <div className="paytags"><span className="paytag cash">ขายสดเท่านั้น</span></div>;
  return (
    <div className="paytags">
      {l.pay.freeDown && <span className="paytag hot">ฟรีดาวน์</span>}
      {l.pay.inhouse && <span className="paytag">ผ่อนกับร้าน</span>}
      {l.pay.finance && <span className="paytag">รับไฟแนนซ์</span>}
    </div>
  );
}

export function Plate({ l }: { l: Listing }) {
  return l.cond === "new"
    ? <span className="plate red">ป้ายแดง</span>
    : <span className="plate white">{provShort(l.province)}</span>;
}

export default function CarCard({ l, priority = false }: { l: Listing; priority?: boolean }) {
  const d = deal(l);
  const ad = l.promo && new Date(l.promo.endsAt) > new Date() ? l.promo.kind : null;
  const cover = l.photos[0];
  return (
    <Link href={listingPath(l)} className={`card${ad === "feature" || ad === "home" ? " featured" : ""}`} title={listingTitle(l)}>
      <div className="stage">
        <Plate l={l} />
        {l.inspected && <span className="badge">✓ ตรวจแล้ว</span>}
        {cover
          ? <img src={cover.url} alt={cover.alt || listingTitle(l)} loading={priority ? "eager" : "lazy"} width={800} height={500} />
          : <CarArt l={l} />}
      </div>
      <div className="body">
        {ad && <span className={`promo${ad === "bump" ? " quiet" : ""}`}>{ad === "bump" ? "ดันประกาศ" : "แนะนำ · โฆษณา"}</span>}
        <h3>{l.year} {l.brand} {l.model}</h3>
        <div className="trim">{l.trim}</div>
        <div className="specs"><span className="num">{baht(l.km)} กม.</span><span>{l.fuel}</span><span>{l.gear}</span><span>{provShort(l.province)}</span></div>
        <div className="pricerow">
          <span className="price num">฿{baht(l.price)}</span>
          {d && <span className={`deal ${d.kind}`}>{d.label}</span>}
        </div>
        <PayTags l={l} />
        <div className="emi">{payLine(l)}</div>
      </div>
    </Link>
  );
}

export function CarGrid({ items, empty }: { items: Listing[]; empty?: string }) {
  if (!items.length) return <div className="empty">{empty ?? "ยังไม่มีรถในหมวดนี้"}</div>;
  return <div className="grid">{items.map((l, i) => <CarCard key={l.id} l={l} priority={i < 3} />)}</div>;
}
