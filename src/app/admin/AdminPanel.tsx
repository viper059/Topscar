"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { baht } from "@/lib/money";

export type Seller = { id: string; display_name: string; shop_name: string | null; seller_type: string; email: string | null; verified: boolean; plan: string; created_at: string; listings: number };
export type AdminListing = { id: string; short_id: string; owner_id: string; brand: string; model: string; year: number; price: number; market_price: number | null; status: string; inspected: boolean; posted_at: string; seller: string };
export type Report = { id: string; reason: string; detail: string | null; created_at: string; resolved: boolean; listing_id: string; short_id: string | null; title: string };

const TYPE_TH: Record<string, string> = { private: "รถบ้าน", tent: "เต็นท์รถ", dealer: "ดีลเลอร์" };
const STATUS_TH: Record<string, string> = { active: "กำลังขาย", hidden: "ซ่อน", sold: "ขายแล้ว", expired: "หมดอายุ" };
const d = (s: string) => new Date(s).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });

async function act(body: Record<string, unknown>) {
  const r = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json().catch(() => ({ ok: false, error: "network" }));
  if (!j.ok) throw new Error(j.error || "failed");
}

export default function AdminPanel({ sellers: s0, listings: l0, reports: r0 }: { sellers: Seller[]; listings: AdminListing[]; reports: Report[] }) {
  const [tab, setTab] = useState<"reports" | "listings" | "sellers">(r0.some((r) => !r.resolved) ? "reports" : "listings");
  const [sellers, setSellers] = useState(s0);
  const [listings, setListings] = useState(l0);
  const [reports, setReports] = useState(r0);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function run(body: Record<string, unknown>, apply: () => void, ok: string) {
    setMsg(null);
    try { await act(body); apply(); setMsg(ok); } catch (e) { setMsg(`ทำรายการไม่สำเร็จ: ${(e as Error).message}`); }
  }
  const setS = (id: string, patch: Partial<Seller>) => setSellers((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const setL = (id: string, patch: Partial<AdminListing>) => setListings((a) => a.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  const ql = q.trim().toLowerCase();
  const fl = useMemo(() => listings.filter((l) => !ql || `${l.brand} ${l.model} ${l.short_id} ${l.seller}`.toLowerCase().includes(ql)), [listings, ql]);
  const fs = useMemo(() => sellers.filter((s) => !ql || `${s.display_name} ${s.shop_name ?? ""} ${s.email ?? ""}`.toLowerCase().includes(ql)), [sellers, ql]);
  const open = reports.filter((r) => !r.resolved).length;

  const tabBtn = (k: typeof tab, label: string) => (
    <button className="field" style={{ width: "auto", fontWeight: tab === k ? 700 : 400, borderColor: tab === k ? "var(--ink)" : undefined }} onClick={() => setTab(k)} aria-pressed={tab === k}>{label}</button>
  );
  const th = { textAlign: "left", padding: "6px 8px", fontSize: 12, color: "var(--muted)", fontWeight: 500, borderBottom: "1px solid var(--line)", whiteSpace: "nowrap" } as const;
  const td = { padding: "8px", borderBottom: "1px solid var(--line)", verticalAlign: "middle", fontSize: 14 } as const;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 }}>
        <div className="box soft" style={{ gap: 2 }}><b className="num" style={{ fontSize: 24 }}>{listings.filter((l) => l.status === "active").length}</b><span className="note">ประกาศที่กำลังขาย</span></div>
        <div className="box soft" style={{ gap: 2 }}><b className="num" style={{ fontSize: 24 }}>{sellers.length}</b><span className="note">สมาชิกคนขาย</span></div>
        <div className="box soft" style={{ gap: 2 }}><b className="num" style={{ fontSize: 24 }}>{sellers.filter((s) => !s.verified).length}</b><span className="note">ยังไม่ยืนยันตัวตน</span></div>
        <div className="box soft" style={{ gap: 2 }}><b className="num" style={{ fontSize: 24, color: open ? "var(--warn)" : undefined }}>{open}</b><span className="note">รายงานรอตรวจ</span></div>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {tabBtn("reports", `รายงาน (${open})`)}{tabBtn("listings", `ประกาศ (${listings.length})`)}{tabBtn("sellers", `คนขาย (${sellers.length})`)}
        {tab !== "reports" && <input className="field" style={{ width: "auto", minWidth: 0, flex: "1 1 200px" }} placeholder="ค้นหา ชื่อ อีเมล รุ่นรถ รหัสประกาศ" value={q} onChange={(e) => setQ(e.target.value)} aria-label="ค้นหา" />}
      </div>
      {msg && <p role="status" style={{ margin: 0, fontWeight: 600 }}>{msg}</p>}

      {tab === "reports" && (
        <div style={{ display: "grid", gap: 8 }}>
          {!reports.length && <div className="empty">ยังไม่มีรายงาน</div>}
          {reports.map((r) => (
            <div key={r.id} className="box" style={{ gap: 6, opacity: r.resolved ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <b>{r.reason}</b><span className="note">{d(r.created_at)}</span>
              </div>
              {r.detail && <p style={{ margin: 0 }}>{r.detail}</p>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {r.short_id ? <Link href={`/r/${r.short_id}`} target="_blank">{r.title}</Link> : <span className="note">{r.title}</span>}
                <button className="field" style={{ width: "auto" }} onClick={() => run({ action: "status", listingId: r.listing_id, value: "hidden" }, () => setL(r.listing_id, { status: "hidden" }), "ซ่อนประกาศแล้ว")}>ซ่อนประกาศนี้</button>
                <button className="field" style={{ width: "auto" }} onClick={() => run({ action: "resolve", reportId: r.id, value: !r.resolved }, () => setReports((a) => a.map((x) => (x.id === r.id ? { ...x, resolved: !r.resolved } : x))), r.resolved ? "เปิดรายงานใหม่แล้ว" : "ปิดรายงานแล้ว")}>{r.resolved ? "เปิดใหม่" : "ตรวจแล้ว ปิดรายงาน"}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "listings" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 760 }}>
            <thead><tr><th style={th}>รถ</th><th style={th}>คนขาย</th><th style={th}>ราคา</th><th style={th}>ราคากลาง</th><th style={th}>ตรวจแล้ว</th><th style={th}>สถานะ</th></tr></thead>
            <tbody>
              {fl.map((l) => (
                <tr key={l.id}>
                  <td style={td}>{l.status === "active" || l.status === "sold" ? <Link href={`/r/${l.short_id}`} target="_blank">{l.year} {l.brand} {l.model}</Link> : `${l.year} ${l.brand} ${l.model}`}<div className="note">{l.short_id} · {d(l.posted_at)}</div></td>
                  <td style={td}>{l.seller}</td>
                  <td style={td} className="num">฿{baht(l.price)}</td>
                  <td style={td}>
                    <input className="field num" type="number" min={0} step={1000} defaultValue={l.market_price ?? ""} placeholder="ว่าง" style={{ width: 120 }} aria-label="ราคากลาง"
                      onBlur={(e) => { const v = e.target.value === "" ? null : Number(e.target.value); if (v !== l.market_price) run({ action: "market_price", listingId: l.id, value: v }, () => setL(l.id, { market_price: v }), "บันทึกราคากลางแล้ว"); }} />
                  </td>
                  <td style={td}><input type="checkbox" checked={l.inspected} aria-label="ตรวจสภาพแล้ว" onChange={(e) => run({ action: "inspected", listingId: l.id, value: e.target.checked }, () => setL(l.id, { inspected: e.target.checked }), e.target.checked ? "ติดป้ายตรวจแล้ว" : "เอาป้ายตรวจออกแล้ว")} /></td>
                  <td style={td}>
                    <select className="field" style={{ width: "auto" }} value={l.status} aria-label="สถานะประกาศ" onChange={(e) => { const v = e.target.value; run({ action: "status", listingId: l.id, value: v }, () => setL(l.id, { status: v }), `เปลี่ยนเป็น “${STATUS_TH[v]}” แล้ว`); }}>
                      {Object.entries(STATUS_TH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!fl.length && <div className="empty" style={{ marginTop: 8 }}>ไม่มีประกาศ</div>}
        </div>
      )}

      {tab === "sellers" && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 720 }}>
            <thead><tr><th style={th}>ชื่อ / ร้าน</th><th style={th}>อีเมล</th><th style={th}>ประเภท</th><th style={th}>ประกาศ</th><th style={th}>ยืนยันตัวตน</th><th style={th}>แพ็กเกจ</th></tr></thead>
            <tbody>
              {fs.map((s) => (
                <tr key={s.id}>
                  <td style={td}><b>{s.shop_name || s.display_name}</b>{s.shop_name && <div className="note">{s.display_name}</div>}<div className="note">สมัคร {d(s.created_at)}</div></td>
                  <td style={td}>{s.email ?? "-"}</td>
                  <td style={td}>{TYPE_TH[s.seller_type] ?? s.seller_type}</td>
                  <td style={td} className="num">{s.listings}</td>
                  <td style={td}><input type="checkbox" checked={s.verified} aria-label="ยืนยันตัวตนแล้ว" onChange={(e) => run({ action: "verify", profileId: s.id, value: e.target.checked }, () => setS(s.id, { verified: e.target.checked }), e.target.checked ? "ยืนยันตัวตนแล้ว" : "ยกเลิกการยืนยันตัวตนแล้ว")} /></td>
                  <td style={td}>
                    <select className="field" style={{ width: "auto" }} value={s.plan} aria-label="แพ็กเกจ" onChange={(e) => { const v = e.target.value; run({ action: "plan", profileId: s.id, value: v }, () => setS(s.id, { plan: v }), v === "free" ? "เปลี่ยนเป็นแพ็กเกจฟรีแล้ว" : `เปิด ${v.toUpperCase()} 30 วันแล้ว`); }}>
                      <option value="free">ฟรี (1 คัน)</option><option value="vip">VIP (15 คัน)</option><option value="pro">Pro (ไม่จำกัด)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!fs.length && <div className="empty" style={{ marginTop: 8 }}>ยังไม่มีสมาชิก</div>}
        </div>
      )}
    </div>
  );
}
