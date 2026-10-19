import { NextResponse, type NextRequest } from "next/server";
import { bangkokDay, serviceDb, sha256 } from "@/lib/server";

const KINDS = new Set(["view", "save"]);

/**
 * POST { listingId, kind: "view" | "save" } — counts seller statistics.
 * Browsers can't write listing_events directly; this route dedupes one view per visitor per listing per day.
 */
export async function POST(req: NextRequest) {
  const { listingId, kind } = (await req.json().catch(() => ({}))) as { listingId?: string; kind?: string };
  const db = serviceDb();
  if (!db || !listingId || !/^[a-z0-9]{4,16}$/.test(listingId) || !kind || !KINDS.has(kind)) return new NextResponse(null, { status: 204 });
  if (/bot|crawl|spider|slurp|preview/i.test(req.headers.get("user-agent") || "")) return new NextResponse(null, { status: 204 });

  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const cookie = `ev_${kind}_${listingId}`;
  if (req.cookies.get(cookie)) return new NextResponse(null, { status: 204 });

  const { data: row } = await db.from("listings").select("id").eq("short_id", listingId).eq("status", "active").maybeSingle();
  if (row) await db.from("listing_events").insert({ listing_id: row.id, kind });

  const res = new NextResponse(null, { status: 204 });
  // one count per browser per listing per day (ip hash kept only in the cookie value, never stored)
  res.cookies.set(cookie, (await sha256(ip + bangkokDay())).slice(0, 8), { maxAge: 86400, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  return res;
}
