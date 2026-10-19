import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentProfile, safeNext, userDb } from "@/lib/server";
import ComingSoon from "@/components/ComingSoon";
import Onboarding from "./Onboarding";
import MyListings, { SignOut, type MyRow } from "./MyListings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "บัญชีของฉัน", robots: { index: false, follow: false } };

const PLAN_TH = { free: "สมาชิกฟรี (ลงพร้อมกันได้ 5 คัน)", vip: "VIP เต็นท์ (30 คัน)", pro: "VIP Pro (ไม่จำกัด)" } as const;

export default async function Account({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <ComingSoon title="บัญชีของฉัน" text="ยังไม่ได้ต่อฐานข้อมูล ตั้งค่า Supabase ก่อน" />;
  const me = await currentProfile();
  if (!me) redirect("/login?next=/account");
  const next = safeNext((await searchParams).next);

  if (!me.profile) {
    return (
      <main className="wrap section" style={{ display: "grid", gap: 14 }}>
        <h1 className="page-h1">ยินดีต้อนรับ</h1>
        <p className="note">เข้าสู่ระบบด้วย {me.user.email} แล้ว ตั้งค่าบัญชีอีกขั้นเดียวก็ลงขายได้</p>
        <Onboarding userId={me.user.id} next={next} />
      </main>
    );
  }

  const db = (await userDb())!;
  const { data: listings } = await db.from("listings")
    .select("id, short_id, brand, model, year, price, status, expires_at, owner_id, listing_photos(r2_key)")
    .eq("owner_id", me.user.id).order("posted_at", { ascending: false });
  const ids = (listings || []).map((l) => l.id);
  const { data: events } = ids.length ? await db.from("listing_events").select("listing_id, kind").in("listing_id", ids) : { data: [] };
  const count = (id: string, kind: string) => (events || []).filter((e) => e.listing_id === id && e.kind === kind).length;
  const rows: MyRow[] = (listings || []).map((l) => ({
    id: l.id, short_id: l.short_id, brand: l.brand, model: l.model, year: l.year, price: l.price, status: l.status,
    expires_at: l.expires_at, owner_id: l.owner_id,
    views: count(l.id, "view"), saves: count(l.id, "save"), contacts: count(l.id, "contact"),
    photoKeys: ((l.listing_photos as { r2_key: string }[]) || []).map((p) => p.r2_key),
  }));
  const p = me.profile;

  return (
    <main className="wrap section" style={{ display: "grid", gap: 16, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h1 className="page-h1" style={{ margin: 0 }}>{p.shop_name || p.display_name}</h1>
          <p className="note">{me.user.email} · {PLAN_TH[p.plan]} · {p.verified ? <span style={{ color: "var(--ok)" }}>✓ ยืนยันตัวตนแล้ว</span> : "ยังไม่ยืนยันตัวตน"}</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link className="primary" href="/sell">+ ลงประกาศใหม่</Link>
          <SignOut />
        </div>
      </div>
      {!p.verified && <p className="note">อยากได้ป้าย “ยืนยันตัวตนแล้ว” ติดต่อทีมงานพร้อมบัตรประชาชน ผู้ซื้อกล้าติดต่อรถที่ยืนยันตัวตนมากกว่า</p>}
      <h2 style={{ margin: 0, fontFamily: "var(--f-display)" }}>ประกาศของฉัน ({rows.length})</h2>
      <MyListings rows={rows} />
      <p className="note"><Link href="/vip">ดูแพ็กเกจ VIP สำหรับเต็นท์รถ</Link></p>
    </main>
  );
}
