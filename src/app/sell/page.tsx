import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentProfile } from "@/lib/server";
import ComingSoon from "@/components/ComingSoon";
import SellForm, { type Prefill } from "./SellForm";
import { brandBySlug, modelBySlug } from "@/lib/catalog";
import { slugify } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ลงประกาศขายรถฟรี", robots: { index: false, follow: true } };

/** /sell?catalog=brand/model prefills the form from the price catalog. Price is never prefilled: the seller enters their own real price. */
function fromCatalog(q?: string): Prefill {
  const [b, m] = (q || "").split("/");
  const brand = b && brandBySlug(slugify(b));
  const model = brand && m ? modelBySlug(brand, slugify(m)) : undefined;
  if (!brand || !model) return {};
  return { cond: "new", brand: brand.name, model: model.model, body: model.body, fuel: model.fuel, year: new Date().getFullYear(), hint: model.from };
}

export default async function Sell({ searchParams }: { searchParams: Promise<{ catalog?: string }> }) {
  const prefill = fromCatalog((await searchParams).catalog);
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return <ComingSoon title="ลงประกาศขายรถฟรี" text="ยังไม่ได้ต่อฐานข้อมูล ตั้งค่า Supabase ก่อน" />;
  const me = await currentProfile();
  if (!me) redirect(`/login?next=${encodeURIComponent(prefill.brand ? `/sell?catalog=${slugify(prefill.brand)}/${slugify(prefill.model!)}` : "/sell")}`);
  if (!me.profile) redirect("/account?next=/sell");
  return (
    <main className="wrap section" style={{ display: "grid", gap: 14 }}>
      <h1 className="page-h1">ลงประกาศขายรถฟรี</h1>
      {prefill.brand && <p className="note">เติมข้อมูล {prefill.brand} {prefill.model} จากแคตตาล็อกให้แล้ว กรอกราคาและรุ่นย่อยตามที่คุณขายจริง ลงได้เฉพาะรถที่คุณมีหรือส่งมอบได้จริง และต้องติดต่อกลับตามเบอร์ของคุณเอง</p>}
      <SellForm userId={me.user.id} province={me.profile.province || "ayutthaya"} plan={me.profile.plan} prefill={prefill} />
    </main>
  );
}
