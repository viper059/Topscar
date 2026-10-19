import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap section">
      <h1 className="page-h1">ไม่พบหน้านี้</h1>
      <p className="note" style={{ marginBottom: 16 }}>ลิงก์อาจพิมพ์ผิด หรือประกาศถูกลบไปแล้ว</p>
      <p style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link className="primary" href="/used-cars">ดูรถมือสอง</Link>
        <Link className="primary" href="/new-cars">ดูรถใหม่ป้ายแดง</Link>
      </p>
    </main>
  );
}
