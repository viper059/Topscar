"use client";
import { useState } from "react";

const REASONS = ["ราคาหรือรายละเอียดไม่ตรงความจริง", "รถคันนี้ขายไปแล้ว", "สงสัยว่าเป็นมิจฉาชีพ", "รูปไม่ใช่รถคันจริง", "อื่นๆ"];

export default function ReportButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done" | "error" | "limit">("idle");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("busy");
    const r = await fetch("/api/report", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ listingId, reason: f.get("reason"), detail: f.get("detail") }),
    }).catch(() => null);
    setState(r?.ok ? "done" : r?.status === 429 ? "limit" : "error");
  }

  if (state === "done") return <p className="note" role="status">ส่งรายงานแล้ว ขอบคุณครับ ทีมงานจะตรวจโดยเร็ว</p>;
  if (!open) return <button type="button" className="note" style={{ background: "none", border: 0, padding: 0, textDecoration: "underline", cursor: "pointer", justifySelf: "start" }} onClick={() => setOpen(true)}>รายงานประกาศนี้</button>;
  return (
    <form onSubmit={submit} className="box soft" style={{ gap: 8 }}>
      <b>รายงานประกาศนี้</b>
      <div style={{ display: "grid", gap: 6, fontSize: 14 }}>
        {REASONS.map((r, i) => (
          <label key={r} style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="radio" name="reason" value={r} defaultChecked={i === 0} /> {r}
          </label>
        ))}
      </div>
      <label htmlFor={`rd-${listingId}`} className="note">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
      <textarea id={`rd-${listingId}`} name="detail" className="field" rows={3} maxLength={500} />
      <div style={{ display: "flex", gap: 8 }}>
        <button className="primary" disabled={state === "busy"}>{state === "busy" ? "กำลังส่ง…" : "ส่งรายงาน"}</button>
        <button type="button" className="field" style={{ width: "auto" }} onClick={() => setOpen(false)}>ยกเลิก</button>
      </div>
      {state === "error" && <p role="alert" style={{ color: "var(--warn)", margin: 0 }}>ส่งไม่สำเร็จ ลองใหม่อีกครั้ง</p>}
      {state === "limit" && <p role="alert" style={{ color: "var(--warn)", margin: 0 }}>วันนี้ส่งรายงานครบ 5 ครั้งแล้ว ลองใหม่พรุ่งนี้</p>}
    </form>
  );
}
