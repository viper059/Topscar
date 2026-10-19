import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentAdmin } from "@/lib/admin";
import { currentUser } from "@/lib/server";
import AdminPanel, { type AdminListing, type Report, type Seller } from "./AdminPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "แอดมิน", robots: { index: false, follow: false } };

export default async function Admin() {
  if (!(await currentUser())) redirect("/login?next=/admin");
  const admin = await currentAdmin();
  if (!admin) notFound(); // non-admins see a normal 404, so the page's existence isn't advertised
  const db = admin.db;

  const [{ data: profiles }, { data: listings }, { data: reports }, users] = await Promise.all([
    db.from("profiles").select("id, display_name, shop_name, seller_type, verified, plan, created_at").order("created_at", { ascending: false }).limit(1000),
    db.from("listings").select("id, short_id, owner_id, brand, model, year, price, market_price, status, inspected, posted_at").order("posted_at", { ascending: false }).limit(1000),
    db.from("reports").select("id, reason, detail, created_at, resolved, listing_id").order("resolved").order("created_at", { ascending: false }).limit(300),
    db.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const email = new Map((users.data?.users ?? []).map((u) => [u.id, u.email ?? null]));
  const name = new Map((profiles ?? []).map((p) => [p.id, p.shop_name || p.display_name]));
  const count = new Map<string, number>();
  (listings ?? []).forEach((l) => count.set(l.owner_id, (count.get(l.owner_id) ?? 0) + 1));
  const byId = new Map((listings ?? []).map((l) => [l.id, l]));

  const sellers: Seller[] = (profiles ?? []).map((p) => ({ ...p, email: email.get(p.id) ?? null, listings: count.get(p.id) ?? 0 }));
  const all: AdminListing[] = (listings ?? []).map((l) => ({ ...l, seller: name.get(l.owner_id) ?? "-" }));
  const reps: Report[] = (reports ?? []).map((r) => {
    const l = byId.get(r.listing_id);
    return { ...r, short_id: l?.short_id ?? null, title: l ? `${l.year} ${l.brand} ${l.model}` : "ประกาศถูกลบแล้ว" };
  });

  return (
    <main className="wrap section" style={{ display: "grid", gap: 14 }}>
      <div>
        <h1 className="page-h1" style={{ margin: 0 }}>แอดมิน</h1>
        <p className="note">เข้าสู่ระบบเป็น {admin.user.email}</p>
      </div>
      <AdminPanel sellers={sellers} listings={all} reports={reps} />
    </main>
  );
}
