"use client";
import { useState } from "react";
import { baht, flatRateLoan } from "@/lib/money";

export default function LoanCalc({ price, downPct, years, rate, fromShop }: { price: number; downPct: number; years: number; rate: number; fromShop: boolean }) {
  const [dp, setDp] = useState(Math.round(downPct));
  const [y, setY] = useState(Math.min(7, Math.max(4, years)));
  const [r, setR] = useState(rate);
  const L = flatRateLoan(price, dp, y, r || 0);
  return (
    <div className="box soft calc">
      <h2>คำนวณค่างวด</h2>
      {fromShop && <p className="note">ตั้งค่าตามเงื่อนไขที่ร้านแจ้งไว้ ปรับเองได้</p>}
      <div className="r">
        <label htmlFor="dp">เงินดาวน์ {dp}% (฿{baht((price * dp) / 100)})</label><span />
        <input id="dp" type="range" min={0} max={50} step={1} value={dp} onChange={(e) => setDp(+e.target.value)} style={{ gridColumn: "1/-1" }} />
      </div>
      <div className="r">
        <label htmlFor="yr">ระยะผ่อน</label>
        <select id="yr" className="field" style={{ width: "auto" }} value={y} onChange={(e) => setY(+e.target.value)}>
          {[4, 5, 6, 7].map((n) => <option key={n} value={n}>{n * 12} งวด</option>)}
        </select>
      </div>
      <div className="r">
        <label htmlFor="rt">ดอกเบี้ยคงที่ (% ต่อปี)</label>
        <input id="rt" className="field" type="number" step="0.01" min={0} value={r} onChange={(e) => setR(+e.target.value)} style={{ width: 90 }} />
      </div>
      <div className="r"><span>ยอดจัด</span><output>฿{baht(L.financed)}</output><span>ดอกเบี้ยรวม</span><output>฿{baht(L.interest)}</output></div>
      <div><div className="note">ค่างวดต่อเดือน (รวม VAT 7%)</div><output className="big">฿{baht(L.monthlyWithVat)}</output></div>
      <p className="note">คิดแบบดอกเบี้ยคงที่ (flat rate) ตามที่ไฟแนนซ์รถในไทยใช้ ตัวเลขจริงขึ้นกับไฟแนนซ์และโปรของร้าน</p>
    </div>
  );
}
