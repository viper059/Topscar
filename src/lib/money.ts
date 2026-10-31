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

/**
 * Effective (declining-balance) annual rate of a flat-rate loan — the rate the OCPB caps apply to.
 * Solves financed = monthly × (1 − (1+r)^−n) / r for the monthly rate r (VAT excluded), by bisection.
 */
export function effectiveRate(financed: number, monthly: number, months: number): number {
  if (financed <= 0 || monthly * months <= financed) return 0;
  const pv = (r: number) => (monthly * (1 - Math.pow(1 + r, -months))) / r;
  let lo = 1e-9, hi = 0.1;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (pv(mid) > financed) lo = mid; else hi = mid; }
  return lo * 12 * 100;
}

/** OCPB car hire-purchase caps on the effective rate (notification in force since 10 Jan 2023). */
export const HP_CAP = { new: 10, used: 15 } as const;

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
