import type { Listing } from "./types";

export const baht = (n: number) => Math.round(n).toLocaleString("th-TH");
export const VAT = 1.07;

/** Thai car loans use a flat rate: interest = principal × rate × years. */
export function flatRateLoan(price: number, downPct: number, years: number, ratePct: number) {
  const financed = price * (1 - downPct / 100);
  const interest = financed * (ratePct / 100) * years;
  const monthly = (financed + interest) / (years * 12);
  return { financed, interest, monthly, monthlyWithVat: monthly * VAT };
}

export const defaultRate = (l: Listing) => (l.cond === "new" ? 2.49 : 4.29);
export const canFinance = (l: Listing) => l.pay.finance || l.pay.inhouse;
export const downOf = (l: Listing) => (l.pay.freeDown ? 0 : l.pay.down ?? l.price * 0.25);
export const estMonthly = (l: Listing) =>
  flatRateLoan(l.price, (downOf(l) / l.price) * 100, 5, l.pay.rate ?? defaultRate(l)).monthlyWithVat;
export const monthlyOf = (l: Listing) => l.pay.monthly ?? estMonthly(l);

export function payLine(l: Listing): string {
  if (!canFinance(l)) return "ขายสดเท่านั้น รับเงินสดหรือโอนเต็มจำนวน";
  const p = l.pay;
  const dn = p.freeDown ? "ไม่ต้องดาวน์" : p.down ? `ดาวน์ ฿${baht(p.down)}` : "";
  if (p.monthly && p.months) return `${dn ? dn + " · " : ""}ผ่อน ฿${baht(p.monthly)} × ${p.months} งวด`;
  return `${dn || "ดาวน์ 25%"} · ผ่อนประมาณ ฿${baht(estMonthly(l))}/เดือน`;
}

export function deal(l: Listing) {
  if (l.cond !== "used" || !l.mkt) return null;
  const r = l.price / l.mkt;
  return { ratio: r, kind: r < 0.96 ? "good" : r > 1.05 ? "high" : "fair", label: r < 0.96 ? "ราคาดี" : r > 1.05 ? "สูงกว่าตลาด" : "ราคาตลาด" } as const;
}
