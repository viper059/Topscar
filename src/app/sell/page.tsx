import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/server";
import ComingSoon from "@/components/ComingSoon";
import SellForm from "./SellForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ลงประกาศขายรถฟรี", robots: { index: false, follow: true } };

export default async function Sell() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <ComingSoon title="ลงประกาศขายรถฟรี" text="ยังไม่ได้ต่อฐานข้อมูล ตั้งค่า Supabase ก่อน" />;
  const me = await currentProfile();
  if (!me) redirect("/login?next=/sell");
  if (!me.profile) redirect("/account?next=/sell");
  return (
    <main className="wrap section" style={{ display: "grid", gap: 14 }}>
      <h1 className="page-h1">ลงประกาศขายรถฟรี</h1>
      <SellForm userId={me.user.id} province={me.profile.province || "ayutthaya"} plan={me.profile.plan} />
    </main>
  );
}
