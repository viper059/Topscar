import { NextResponse, type NextRequest } from "next/server";
import { currentUser, serviceDb } from "@/lib/server";

const REASONS = ["ราคาหรือรายละเอียดไม่ตรงความจริง", "รถคันนี้ขายไปแล้ว", "สงสัยว่าเป็นมิจฉาชีพ", "รูปไม่ใช่รถคันจริง", "อื่นๆ"] as const;
const DAILY = 5;

/**
 * POST { listingId, reason, detail? } — a buyer reports a listing. Shows up in /admin.
 * One report per listing per browser, at most 5 per browser per day, so nobody can flood the queue.
 */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { listingId?: string; reason?: string; detail?: string };
  const db = serviceDb();
  if (!db) return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  if (!b.listingId || !/^[a-z0-9]{4,16}$/.test(b.listingId) || !REASONS.includes(b.reason as (typeof REASONS)[number]))
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });

  const sent = (req.cookies.get("rp")?.value || "").split(".").filter(Boolean);
  if (sent.includes(b.listingId)) return NextResponse.json({ ok: true, already: true });
  if (sent.length >= DAILY) return NextResponse.json({ ok: false, error: "limit" }, { status: 429 });

  const { data: row } = await db.from("listings").select("id").eq("short_id", b.listingId).maybeSingle();
  if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  const user = await currentUser();
  const { error } = await db.from("reports").insert({
    listing_id: row.id, reason: b.reason, detail: (b.detail || "").trim().slice(0, 500) || null, reporter_id: user?.id ?? null,
  });
  if (error) return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("rp", [...sent, b.listingId].join("."), { maxAge: 86400, httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  return res;
}
