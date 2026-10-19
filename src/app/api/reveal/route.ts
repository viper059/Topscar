import { NextResponse, type NextRequest } from "next/server";
import { bangkokDay, currentUser, serviceDb, sha256 } from "@/lib/server";
import { getListing, hasDb } from "@/lib/data";

const LIMIT = Number(process.env.GUEST_REVEAL_LIMIT || 15);
const noStore = { "cache-control": "no-store", "x-robots-tag": "noindex" };

/**
 * POST { listingId } → seller phone / LINE ID.
 * Members: unlimited. Guests: up to LIMIT different listings per Bangkok day, counted per hashed IP.
 */
export async function POST(req: NextRequest) {
  const { listingId } = (await req.json().catch(() => ({}))) as { listingId?: string };
  if (!listingId || !/^[a-z0-9]{4,16}$/.test(listingId)) return NextResponse.json({ ok: false, reason: "error" }, { status: 400, headers: noStore });

  const db = serviceDb();
  const user = await currentUser();
  const ip = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const visitor = user ? `u:${user.id}` : await sha256(ip + (process.env.REVEAL_SALT || "dev-salt"));
  const day = bangkokDay();

  // Supabase connected but the server secret is missing: never fall back to fake numbers on real listings.
  if (!db && hasDb) return NextResponse.json({ ok: false, reason: "error" }, { status: 503, headers: noStore });

  // ---- sample-data mode (no Supabase yet): count with a cookie so the flow can be tried ----
  if (!db) {
    const l = await getListing(listingId);
    if (!l || l.status !== "active") return NextResponse.json({ ok: false, reason: "error" }, { status: 404, headers: noStore });
    const seen = new Set((req.cookies.get(`rv_${day}`)?.value || "").split(".").filter(Boolean));
    if (!seen.has(listingId) && seen.size >= LIMIT) return NextResponse.json({ ok: false, reason: "limit", limit: LIMIT }, { headers: noStore });
    seen.add(listingId);
    const res = NextResponse.json({ ok: true, phone: "08x-xxx-xxxx (ตัวอย่าง)", line: "sample-line-id", left: LIMIT - seen.size }, { headers: noStore });
    res.cookies.set(`rv_${day}`, [...seen].join("."), { maxAge: 86400, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
    return res;
  }

  // ---- live mode ----
  const { data: row } = await db.from("listings").select("id,status").eq("short_id", listingId).maybeSingle();
  if (!row || row.status !== "active") return NextResponse.json({ ok: false, reason: "error" }, { status: 404, headers: noStore });

  let left: number | null = null;
  if (!user) {
    const { data: already } = await db.from("contact_reveals").select("listing_id").eq("day", day).eq("visitor", visitor).eq("listing_id", row.id).maybeSingle();
    if (!already) {
      const { count } = await db.from("contact_reveals").select("*", { count: "exact", head: true }).eq("day", day).eq("visitor", visitor);
      if ((count ?? 0) >= LIMIT) return NextResponse.json({ ok: false, reason: "limit", limit: LIMIT }, { headers: noStore });
      await db.from("contact_reveals").insert({ day, visitor, listing_id: row.id });
      left = LIMIT - ((count ?? 0) + 1);
    } else {
      const { count } = await db.from("contact_reveals").select("*", { count: "exact", head: true }).eq("day", day).eq("visitor", visitor);
      left = LIMIT - (count ?? 0);
    }
  }

  const { data: c } = await db.from("listing_contacts").select("phone,line_id").eq("listing_id", row.id).maybeSingle();
  await db.from("listing_events").insert({ listing_id: row.id, kind: "contact" });
  return NextResponse.json({ ok: true, phone: c?.phone ?? null, line: c?.line_id ?? null, left }, { headers: noStore });
}
