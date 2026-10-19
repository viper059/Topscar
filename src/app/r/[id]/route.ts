import { NextResponse } from "next/server";
import { getListing } from "@/lib/data";
import { abs, listingPath } from "@/lib/seo";

/** Short share link tops-car.com/r/<id> → permanent redirect to the full SEO URL. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = await getListing(id);
  if (!l) return NextResponse.redirect(abs("/used-cars"), 302);
  return NextResponse.redirect(abs(listingPath(l)), 301);
}
