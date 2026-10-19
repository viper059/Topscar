"use client";
import { useState } from "react";
import Link from "next/link";

type Result =
  | { ok: true; phone: string | null; line: string | null; left: number | null }
  | { ok: false; reason: "limit"; limit: number }
  | { ok: false; reason: "error" };

// Seller contact is never in the page HTML; it is fetched on tap, so scrapers can't harvest it
// and guests are limited per day (members unlimited). See src/app/api/reveal/route.ts.
export default function ContactBox({ listingId, sold }: { listingId: string; sold: boolean }) {
  const [res, setRes] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function reveal() {
    setBusy(true);
    try {
      const r = await fetch("/api/reveal", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ listingId }) });
      setRes(await r.json());
    } catch { setRes({ ok: false, reason: "error" }); }
    setBusy(false);
  }
  const copy = (t: string) => navigator.clipboard?.writeText(t).catch(() => {});

  if (sold) return <div className="sold-banner">รถคันนี้ขายแล้ว ดูรถคล้ายกันด้านล่าง</div>;
  return (
    <div className="box">
      <h2>ติดต่อผู้ขาย</h2>
      {!res && (
        <div className="actions">
          <button className="a-call" onClick={reveal} disabled={busy}>ดูเบอร์โทร</button>
          <button className="a-line" onClick={reveal} disabled={busy}>ดู LINE ID</button>
        </div>
      )}
      {res?.ok && (
        <div className="reveal" style={{ display: "grid", gap: 8 }}>
          {res.phone && <div><div className="note">เบอร์โทร</div><code>{res.phone}</code> <button className="field" style={{ width: "auto" }} onClick={() => copy(res.phone!)}>คัดลอก</button></div>}
          {res.line && <div><div className="note">LINE ID</div><code>{res.line}</code> <button className="field" style={{ width: "auto" }} onClick={() => copy(res.line!)}>คัดลอก</button></div>}
          {res.left !== null && <p className="note">ยังไม่ได้เข้าสู่ระบบ: วันนี้ดูข้อมูลติดต่อได้อีก {res.left} คัน</p>}
        </div>
      )}
      {res && !res.ok && res.reason === "limit" && (
        <div style={{ display: "grid", gap: 8 }}>
          <b>วันนี้ดูข้อมูลติดต่อครบ {res.limit} คันแล้ว</b>
          <p className="note">สมัครสมาชิกฟรี แล้วดูต่อได้ไม่จำกัด เราจำกัดไว้เพื่อกันคนดูดเบอร์คนขายไปใช้</p>
          <Link className="primary" href={`/login?next=/r/${listingId}`}>สมัคร / เข้าสู่ระบบ</Link>
        </div>
      )}
      {res && !res.ok && res.reason === "error" && <p className="note">โหลดข้อมูลติดต่อไม่สำเร็จ ลองกดอีกครั้ง</p>}
      <p className="note">อย่าโอนเงินจองก่อนเห็นรถและเล่มทะเบียนตัวจริง</p>
    </div>
  );
}
