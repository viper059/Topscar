"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase-browser";
import { PROVINCES } from "@/lib/provinces";
import Link from "next/link";

/** First visit after sign-up: name shown on listings, seller type, PDPA consent. */
export default function Onboarding({ userId, next }: { userId: string; next: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [type, setType] = useState<"private" | "tent" | "dealer">("private");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr(null);
    const { error } = await sb().from("profiles").insert({
      id: userId,
      display_name: String(f.get("name")).trim(),
      seller_type: type,
      shop_name: type === "private" ? null : String(f.get("shop") || "").trim() || null,
      province: String(f.get("province")) || null,
      pdpa_accepted_at: new Date().toISOString(),
    });
    setBusy(false);
    if (error) return setErr(`บันทึกไม่สำเร็จ: ${error.message}`);
    location.assign(next);
  }

  return (
    <form onSubmit={save} className="box" style={{ maxWidth: 520 }}>
      <h2>ตั้งค่าบัญชี</h2>
      <label htmlFor="name">ชื่อที่แสดงบนประกาศ</label>
      <input id="name" name="name" className="field" required maxLength={60} placeholder="เช่น หนุ่ม อยุธยา" />
      <span>คุณขายรถแบบไหน</span>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
        {([["private", "รถบ้าน (ขายรถตัวเอง)"], ["tent", "เต็นท์รถ"], ["dealer", "ดีลเลอร์"]] as const).map(([v, t]) => (
          <label key={v} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="radio" name="type" value={v} checked={type === v} onChange={() => setType(v)} /> {t}
          </label>
        ))}
      </div>
      {type !== "private" && (<><label htmlFor="shop">ชื่อร้าน</label><input id="shop" name="shop" className="field" maxLength={80} placeholder="เช่น ช่างหนุ่มอยุธยา" /></>)}
      <label htmlFor="province">จังหวัด</label>
      <select id="province" name="province" className="field" defaultValue="ayutthaya">
        {Object.entries(PROVINCES).map(([s, n]) => <option key={s} value={s}>{n}</option>)}
      </select>
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <input type="checkbox" required style={{ marginTop: 4 }} />
        <span className="note">ยอมรับ<Link href="/terms" target="_blank">ข้อตกลงการใช้งาน</Link>และ<Link href="/privacy" target="_blank">นโยบายความเป็นส่วนตัว (PDPA)</Link> ยินยอมให้แสดงเบอร์โทรเมื่อผู้ซื้อกดดู</span>
      </label>
      <button className="primary" disabled={busy}>{busy ? "กำลังบันทึก…" : "บันทึกและเริ่มใช้งาน"}</button>
      {err && <p role="alert" style={{ color: "var(--warn)", margin: 0 }}>{err}</p>}
    </form>
  );
}
