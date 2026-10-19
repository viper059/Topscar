import Link from "next/link";
import type { Listing } from "@/lib/types";
import { hubLabel, hubPath, hubsFor } from "@/lib/seo";

export function JsonLd({ data }: { data: object }) {
  // `<` escaped so listing text can never close the script tag.
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export function Crumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="breadcrumb">
      <ol className="crumbs">
        {items.map((c, i) => (
          <li key={c.path}>{i === items.length - 1 ? <span aria-current="page">{c.name}</span> : <Link href={c.path}>{c.name}</Link>}</li>
        ))}
      </ol>
    </nav>
  );
}

/** Internal links to hub pages: how Google discovers and ranks model/province pages. */
export function HubLinks({ items, title = "ค้นหายอดนิยม" }: { items: Listing[]; title?: string }) {
  const hubs = hubsFor(items);
  const count = (path: string) => items.filter((l) => {
    const h = hubs.find((x) => hubPath(x) === path)!;
    return l.cond === h.cond && (!h.brand || l.brand === h.brand) && (!h.model || l.model === h.model) &&
      (!h.province || l.province === h.province) && (!h.body || l.body === h.body);
  }).length;
  const col = (name: string, pick: (h: (typeof hubs)[number]) => boolean) => {
    const list = hubs.filter(pick).slice(0, 12);
    if (!list.length) return null;
    return (
      <div>
        <h3>{name}</h3>
        <ul>{list.map((h) => { const p = hubPath(h); return <li key={p}><Link href={p}>{hubLabel(h)}</Link> <span className="note">({count(p)})</span></li>; })}</ul>
      </div>
    );
  };
  return (
    <section className="section">
      <h2>{title}</h2>
      <div className="hubcols">
        {col("ตามรุ่น", (h) => !!h.model && !h.province)}
        {col("ตามรุ่นและจังหวัด", (h) => !!h.model && !!h.province)}
        {col("ตามประเภทรถ", (h) => !!h.body)}
        {col("ตามจังหวัด", (h) => !h.brand && !h.body && !!h.province)}
      </div>
    </section>
  );
}
