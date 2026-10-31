import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { currentUser, safeNext } from "@/lib/server";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "เข้าสู่ระบบ / สมัครสมาชิก", robots: { index: false, follow: true } };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await currentUser()) redirect(next);
  return (
    <main className="wrap section" style={{ display: "grid", gap: 14 }}>
      <h1 className="page-h1">เข้าสู่ระบบ / สมัครสมาชิก</h1>
      <p className="note" style={{ maxWidth: "60ch" }}>บัญชีเดียวใช้ได้ทั้งซื้อและขาย ลงประกาศขายรถฟรี ดูเบอร์ผู้ขายได้ไม่จำกัด และดูสถิติว่ามีคนสนใจรถของคุณกี่คน</p>
      {sp.error && <p role="alert" style={{ color: "var(--warn)", margin: 0 }}>ลิงก์เข้าสู่ระบบหมดอายุหรือเปิดคนละเครื่อง ลองขอรหัสใหม่อีกครั้ง</p>}
      <LoginForm next={next} />
      <p className="note">การเข้าสู่ระบบถือว่ายอมรับ<Link href="/terms">ข้อตกลงการใช้งาน</Link>และ<Link href="/privacy">นโยบายความเป็นส่วนตัว</Link></p>
    </main>
  );
}
