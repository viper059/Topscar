import Link from "next/link";

// Placeholder for member pages that are built in the next step (auth + upload).
export default function ComingSoon({ title, text }: { title: string; text: string }) {
  return (
    <main className="wrap section" style={{ maxWidth: 640 }}>
      <h1 className="page-h1">{title}</h1>
      <p className="note" style={{ marginBottom: 16 }}>{text}</p>
      <Link className="primary" href="/used-cars">ดูรถทั้งหมด</Link>
    </main>
  );
}
