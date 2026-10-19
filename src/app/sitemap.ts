import type { MetadataRoute } from "next";
import { findListings } from "@/lib/data";
import { abs, hubPath, hubsFor, listingPath } from "@/lib/seo";

export const dynamic = "force-dynamic";

/** Every listing (sold ones too, for 60 days of search traffic) plus every hub page that has cars. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const items = await findListings({ includeSold: true, limit: 45000 });
  const live = items.filter((l) => l.status === "active");
  const latest = (list: typeof items) => new Date(Math.max(...list.map((l) => +new Date(l.postedAt)), 0));
  return [
    { url: abs("/"), lastModified: latest(live), changeFrequency: "hourly", priority: 1 },
    ...hubsFor(live).map((h) => ({ url: abs(hubPath(h)), lastModified: latest(live), changeFrequency: "daily" as const, priority: h.model ? 0.7 : 0.8 })),
    ...items.map((l) => ({
      url: abs(listingPath(l)),
      lastModified: new Date(l.postedAt),
      changeFrequency: "weekly" as const,
      priority: l.status === "active" ? 0.6 : 0.3,
      images: l.photos.slice(0, 5).map((p) => p.url),
    })),
  ];
}
