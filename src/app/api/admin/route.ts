import { NextResponse, type NextRequest } from "next/server";
import { currentAdmin } from "@/lib/admin";

const PLANS = new Set(["free", "vip", "pro"]);
const STATUSES = new Set(["active", "hidden", "sold", "expired"]);

type Body =
  | { action: "verify"; profileId: string; value: boolean }
  | { action: "plan"; profileId: string; value: string }
  | { action: "inspected"; listingId: string; value: boolean }
  | { action: "status"; listingId: string; value: string }
  | { action: "market_price"; listingId: string; value: number | null }
  | { action: "resolve"; reportId: string; value: boolean };

const uuid = /^[0-9a-f-]{36}$/;
const bad = (msg: string) => NextResponse.json({ ok: false, error: msg }, { status: 400 });

/** Admin actions. Every call re-checks that the signed-in user is in the `admins` table. */
export async function POST(req: NextRequest) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  const b = (await req.json().catch(() => null)) as Body | null;
  if (!b) return bad("invalid body");
  const db = admin.db;
  let res;
  switch (b.action) {
    case "verify":
      if (!uuid.test(b.profileId)) return bad("profileId");
      res = await db.from("profiles").update({ verified: !!b.value }).eq("id", b.profileId);
      break;
    case "plan":
      if (!uuid.test(b.profileId) || !PLANS.has(b.value)) return bad("plan");
      res = await db.from("profiles").update({ plan: b.value, plan_until: b.value === "free" ? null : new Date(Date.now() + 30 * 864e5).toISOString() }).eq("id", b.profileId);
      break;
    case "inspected":
      if (!uuid.test(b.listingId)) return bad("listingId");
      res = await db.from("listings").update({ inspected: !!b.value }).eq("id", b.listingId);
      break;
    case "status":
      if (!uuid.test(b.listingId) || !STATUSES.has(b.value)) return bad("status");
      res = await db.from("listings").update({ status: b.value }).eq("id", b.listingId);
      break;
    case "market_price": {
      if (!uuid.test(b.listingId)) return bad("listingId");
      const v = b.value === null ? null : Math.round(Number(b.value));
      if (v !== null && !(v > 0 && v < 1e9)) return bad("market_price");
      res = await db.from("listings").update({ market_price: v }).eq("id", b.listingId);
      break;
    }
    case "resolve":
      if (!uuid.test(b.reportId)) return bad("reportId");
      res = await db.from("reports").update({ resolved: !!b.value }).eq("id", b.reportId);
      break;
    default:
      return bad("unknown action");
  }
  if (res.error) return NextResponse.json({ ok: false, error: res.error.message }, { status: 500 });
  return NextResponse.json({ ok: true }, { headers: { "cache-control": "no-store" } });
}
