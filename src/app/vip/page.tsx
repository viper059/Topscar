import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT_PHONE, CONTACT_TEL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "แพ็กเกจลงประกาศขายรถสำหรับเต็นท์รถและดีลเลอร์",
  description: "ลงประกาศขายรถฟรี 5 คัน หรือเลือก VIP เต็นท์ ฿990/เดือน ลงได้ 30 คัน ช่วงเปิดตัวทดลองฟรี 30 วัน",
  alternates: { canonical: "/vip" },
};

// soon: true = not built yet. Shown as "เร็วๆ นี้" so the page never promises something we can't deliver
// (Thai Consumer Protection Act: no misleading advertising). Flip to false when the feature ships.
const PLANS = [
  { name: "สมาชิกฟรี", price: "฿0", items: [["ลงประกาศพร้อมกันได้ 5 คัน"], ["แสดงประกาศ 60 วัน ต่ออายุฟรี"], ["ดูสถิติคนดูและคนกดดูเบอร์"]] },
  { name: "VIP เต็นท์", price: "฿990/เดือน", items: [["ลงประกาศพร้อมกันได้ 30 คัน"], ["หน้าร้านพร้อมโลโก้และแผนที่", "soon"], ["ดันประกาศอัตโนมัติวันละ 1 ครั้ง", "soon"], ["ป้ายแนะนำฟรี 2 ครั้งต่อเดือน", "soon"]] },
  { name: "VIP Pro", price: "฿2,990/เดือน", items: [["ลงประกาศไม่จำกัด"], ["ช่องหน้าแรก 1 สัปดาห์ต่อเดือน", "soon"], ["สถิติละเอียดรายคันและรายสัปดาห์", "soon"], ["ทีมงานถ่ายรูปรถให้ถึงที่", "soon"]] },
];

export default function Vip() {
  return (
    <main className="wrap section">
      <h1 className="page-h1">แพ็กเกจสำหรับคนขายรถ</h1>
      <p className="note" style={{ marginBottom: 16 }}>คนขายทั่วไปลงฟรีได้เสมอ ช่วงเปิดตัวเต็นท์รถทดลองใช้ VIP ฟรี 30 วัน ยังไม่เปิดชำระเงินออนไลน์ สนใจ VIP โทร <a href={CONTACT_TEL}>{CONTACT_PHONE}</a></p>
      <div className="grid">
        {PLANS.map((p) => (
          <div key={p.name} className="box">
            <h2>{p.name}</h2>
            <div className="big">{p.price}</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>{p.items.map(([t, soon]) => <li key={t}>{t}{soon && <span className="note"> (เร็วๆ นี้)</span>}</li>)}</ul>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 16 }}><Link className="primary" href="/sell">เริ่มลงประกาศ</Link></p>
    </main>
  );
}
