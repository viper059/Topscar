import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";
import { BRAND, SITE } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${BRAND} ตลาดรถใหม่ป้ายแดงและรถมือสอง ลงประกาศขายฟรี`, template: `%s | ${BRAND}` },
  description: "ซื้อขายรถใหม่ป้ายแดงและรถมือสอง ค้นหาด้วยภาษาพูด เทียบราคากับตลาด เช็คเงื่อนไขผ่อน ฟรีดาวน์ ผ่อนกับร้าน ลงประกาศขายรถฟรี",
  applicationName: BRAND,
  openGraph: { siteName: BRAND, locale: "th_TH", type: "website" },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#23282e" }, { media: "(prefers-color-scheme: dark)", color: "#0e1012" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: BRAND, url: SITE },
      { "@type": "WebSite", name: BRAND, url: SITE,
        potentialAction: { "@type": "SearchAction", target: `${SITE}/search?q={q}`, "query-input": "required name=q" } },
    ],
  };
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }} />
      </head>
      <body>
        <header className="site-head">
          <div className="wrap">
            <Link href="/" className="logo"><i />{BRAND}</Link>
            <nav aria-label="เมนูหลัก">
              <Link href="/used-cars">รถมือสอง</Link>
              <Link href="/new-cars">รถใหม่</Link>
              <Link href="/account">บัญชีของฉัน</Link>
              <Link href="/sell" className="btn-sell">+ ลงขายฟรี</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-foot">
          <div className="wrap">
            © {new Date().getFullYear()} {BRAND} · <Link href="/terms">ข้อตกลงการใช้งาน</Link> · <Link href="/privacy">นโยบายความเป็นส่วนตัว</Link> · <Link href="/vip">แพ็กเกจสำหรับเต็นท์รถ</Link>
          </div>
        </footer>
      </body>
    </html>
  );
}
