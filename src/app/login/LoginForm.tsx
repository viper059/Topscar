"use client";
import { useState } from "react";
import { sb } from "@/lib/supabase-browser";

const GOOGLE = process.env.NEXT_PUBLIC_AUTH_GOOGLE === "1";

export default function LoginForm({ next }: { next: string }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const callback = () => `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await sb().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback(), shouldCreateUser: true } });
    setBusy(false);
    if (error) return setMsg(error.status === 429 ? "ส่งอีเมลถี่เกินไป รอสักครู่แล้วลองใหม่" : `ส่งอีเมลไม่สำเร็จ: ${error.message}`);
    setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const { error } = await sb().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) return setMsg("รหัสไม่ถูกต้องหรือหมดอายุ ลองขอรหัสใหม่");
    location.assign(next);
  }

  async function google() {
    await sb().auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback() } });
  }

  return (
    <div className="box" style={{ maxWidth: 420 }}>
      {step === "email" ? (
        <form onSubmit={sendCode} style={{ display: "grid", gap: 10 }}>
          <label htmlFor="email">อีเมล</label>
          <input id="email" className="field" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="primary" disabled={busy}>{busy ? "กำลังส่ง…" : "ส่งรหัสเข้าสู่ระบบ"}</button>
          <p className="note">ไม่ต้องตั้งรหัสผ่าน เราจะส่งรหัส 6 หลักและลิงก์เข้าสู่ระบบไปที่อีเมลนี้ ยังไม่เป็นสมาชิกก็ใช้ได้ ระบบจะสมัครให้อัตโนมัติ</p>
          {GOOGLE && <button type="button" className="field" onClick={google} style={{ fontWeight: 600, cursor: "pointer" }}>เข้าสู่ระบบด้วย Google</button>}
        </form>
      ) : (
        <form onSubmit={verify} style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0 }}>ส่งรหัสไปที่ <b>{email}</b> แล้ว</p>
          <label htmlFor="code">รหัสจากอีเมล</label>
          <input id="code" className="field num" required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} style={{ fontSize: 22, letterSpacing: ".2em" }} />
          <button className="primary" disabled={busy}>{busy ? "กำลังตรวจ…" : "เข้าสู่ระบบ"}</button>
          <p className="note">หรือกดลิงก์ในอีเมลบนเครื่องนี้ก็ได้ ไม่เห็นอีเมล ลองดูในโฟลเดอร์ขยะหรือโปรโมชัน</p>
          <button type="button" className="field" style={{ cursor: "pointer" }} onClick={() => { setStep("email"); setCode(""); }}>เปลี่ยนอีเมล / ขอรหัสใหม่</button>
        </form>
      )}
      {msg && <p role="alert" style={{ color: "var(--warn)", margin: 0 }}>{msg}</p>}
    </div>
  );
}
