"use client";
import { useState } from "react";
import Link from "next/link";
import { sb, PHOTO_BUCKET } from "@/lib/supabase-browser";
import { baht } from "@/lib/money";

export type MyRow = {
  id: string; short_id: string; brand: string; model: string; year: number; price: number;
  status: "active" | "sold" | "expired" | "hidden"; expires_at: string; owner_id: string;
  views: number; saves: number; contacts: number; photoKeys: string[];
};

const DAY = 864e5;
const PILL: Record<MyRow["status"], [string, string]> = {
  active: ["กำลังขาย", "var(--ok)"], sold: ["ขายแล้ว", "var(--muted)"], expired: ["หมดอายุ", "var(--warn)"], hidden: ["ยังลงไม่เสร็จ", "var(--warn)"],
};

export default function MyListings({ rows: initial }: { rows: MyRow[] }) {
  const [rows, setRows] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  async function setStatus(r: MyRow, status: MyRow["status"], extra: Record<string, unknown> = {}) {
    setMsg(null);
    const { data, error } = await sb().from("listings").update({ status, ...extra }).eq("id", r.id).select("status, expires_at").single();
    if (error) {
      const cap = /listing_cap_reached:(\d+)/.exec(error.message)?.[1];
      return setMsg(cap ? `แพ็กเกจของคุณลงพร้อมกันได้ ${cap} คัน ปิดประกาศอื่นก่อน หรืออัปเกรดเป็น VIP` : `ทำรายการไม่สำเร็จ: ${error.message}`);
    }
    setRows((all) => all.map((x) => (x.id === r.id ? { ...x, ...data } : x)));
    setMsg(status === "sold" ? "ทำเครื่องหมายขายแล้ว หน้าประกาศยังอยู่ให้คนค้นเจอ พร้อมแนะนำรถคล้ายกัน" : status === "active" ? "เปิดประกาศแล้ว แสดงต่ออีก 60 วัน" : null);
  }
  const renew = (r: MyRow) =>
    r.status === "active" ? setStatus(r, "active", { expires_at: new Date(Date.now() + 60 * DAY).toISOString() }) : setStatus(r, "active");

  async function remove(r: MyRow) {
    setMsg(null);
    if (r.photoKeys.length) await sb().storage.from(PHOTO_BUCKET).remove(r.photoKeys);
    const { error } = await sb().from("listings").delete().eq("id", r.id);
    if (error) return setMsg(`ลบไม่สำเร็จ: ${error.message}`);
    setRows((all) => all.filter((x) => x.id !== r.id));
    setConfirmDel(null);
    setMsg("ลบประกาศแล้ว");
  }

  const total = (k: "views" | "saves" | "contacts") => rows.reduce((a, r) => a + r[k], 0);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {([["views", "คนดูประกาศ"], ["saves", "บันทึกรถคุณ"], ["contacts", "ดูเบอร์ / LINE"]] as const).map(([k, t]) => (
          <div key={k} className="box soft" style={{ gap: 2 }}><b className="num" style={{ fontSize: 24 }}>{baht(total(k))}</b><span className="note">{t}</span></div>
        ))}
      </div>
      {msg && <p role="status" style={{ margin: 0, fontWeight: 600 }}>{msg}</p>}
      {!rows.length && <div className="empty">ยังไม่มีประกาศ <Link href="/sell">ลงขายคันแรกฟรี</Link></div>}
      {rows.map((r) => {
        const left = Math.ceil((+new Date(r.expires_at) - Date.now()) / DAY);
        const [label, color] = r.status === "active" && left <= 7 ? [`เหลือ ${Math.max(left, 0)} วัน`, "var(--warn)"] : PILL[r.status];
        return (
          <div key={r.id} className="box" style={{ gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
              <b>{r.year} {r.brand} {r.model} · <span className="num">฿{baht(r.price)}</span></b>
              <span style={{ color, border: "1px solid currentColor", borderRadius: 999, padding: "1px 9px", fontSize: 13, fontWeight: 600 }}>
                {label}{r.status === "active" && left > 7 ? ` · เหลือ ${left} วัน` : ""}
              </span>
            </div>
            <div className="note" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <span>👁 <b className="num">{r.views}</b> คนดู</span><span>♡ <b className="num">{r.saves}</b> บันทึก</span><span>☎ <b className="num">{r.contacts}</b> ดูเบอร์</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {(r.status === "active" || r.status === "sold") && <Link className="field" style={{ width: "auto", textDecoration: "none" }} href={`/r/${r.short_id}`}>ดูประกาศ</Link>}
              {r.status === "active" && <button className="field" style={{ width: "auto" }} onClick={() => setStatus(r, "sold")}>ขายแล้ว</button>}
              {r.status !== "hidden" && <button className="field" style={{ width: "auto" }} onClick={() => renew(r)}>{r.status === "active" ? "ต่ออายุ 60 วัน" : "เปิดขายอีกครั้ง"}</button>}
              {r.status === "hidden" && <button className="field" style={{ width: "auto" }} onClick={() => setStatus(r, "active")}>เปิดประกาศ</button>}
              {confirmDel === r.id
                ? <><button className="field" style={{ width: "auto", color: "var(--warn)", fontWeight: 600 }} onClick={() => remove(r)}>ยืนยันลบถาวร</button><button className="field" style={{ width: "auto" }} onClick={() => setConfirmDel(null)}>ยกเลิก</button></>
                : <button className="field" style={{ width: "auto" }} onClick={() => setConfirmDel(r.id)}>ลบ</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function SignOut() {
  return (
    <button className="field" style={{ width: "auto" }} onClick={async () => { await sb().auth.signOut(); location.assign("/"); }}>
      ออกจากระบบ
    </button>
  );
}
