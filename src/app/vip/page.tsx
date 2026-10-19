import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "แพ็กเกจลงประกาศขายรถสำหรับเต็นท์รถและดีลเลอร์",
  description: "ลงประกาศขายรถฟรี 5 คัน หรือเลือก VIP เต็นท์ ฿990/เดือน ลงได้ 30 คัน มีหน้าร้าน ดันประกาศอัตโนมัติ ช่วงเปิดตัวทดลองฟรี 30 วัน",
  alternates: { canonical: "/vip" },
};

const PLANS = [
  { name: "สมาชิกฟรี", price: "฿0", items: ["ลงประกาศพร้อมกันได้ 5 คัน", "แสดงประกาศ 60 วัน ต่ออายุฟรี", "ดูสถิติคนดู บันทึก ติดต่อ"] },
  { name: "VIP เต็นท์", price: "฿990/เดือน", items: ["ลงประกาศได้ 30 คัน", "หน้าร้านพร้อมโลโก้และแผนที่", "ดันประกาศอัตโนมัติวันละ 1 ครั้ง", "ป้ายแนะนำฟรี 2 ครั้งต่อเดือน"] },
  { name: "VIP Pro", price: "฿2,990/เดือน", items: ["ลงประกาศไม่จำกัด", "ช่องหน้าแรก 1 สัปดาห์ต่อเดือน", "สถิติละเอียดรายคันและรายสัปดาห์", "ทีมงานถ่ายรูปรถให้ถึงที่"] },
];

export default function Vip() {
  return (
    <main className="wrap section">
      <h1 className="page-h1">แพ็กเกจสำหรับคนขายรถ</h1>
      <p className="note" style={{ marginBottom: 16 }}>คนขายทั่วไปลงฟรีได้เสมอ ช่วงเปิดตัวเต็นท์รถทดลองใช้ VIP ฟรี 30 วัน</p>
      <div className="grid">
        {PLANS.map((p) => (
          <div key={p.name} className="box">
            <h2>{p.name}</h2>
            <div className="big">{p.price}</div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 4 }}>{p.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </div>
        ))}
      </div>
      <p style={{ marginTop: 16 }}><Link className="primary" href="/sell">เริ่มลงประกาศ</Link></p>
    </main>
  );
}
