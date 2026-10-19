import type { BodyType, Cond, Listing } from "./types";
import { canFinance, downOf, monthlyOf, baht } from "./money";
import { NEAR, provinceFromText, provShort } from "./provinces";
import { slugify } from "./seo";

/** Plain-language Thai search: "กระบะ งบ 9 แสน ใกล้อยุธยา", "ฟรีดาวน์ ผ่อนไม่เกิน 9 พัน". */
export type Ask = {
  cond?: Cond; brand?: string; body?: BodyType[]; fuels?: string[]; maxPrice?: number; minYear?: number;
  province?: string; near?: boolean; inspected?: boolean; pays?: ("any" | "freeDown" | "inhouse")[];
  maxDown?: number; maxMonthly?: number; words?: string[];
};

const UNIT: Record<string, number> = { ล้าน: 1e6, แสน: 1e5, หมื่น: 1e4, พัน: 1e3 };
const BRANDS: Record<string, string> = {
  toyota: "Toyota", โตโยต้า: "Toyota", honda: "Honda", ฮอนด้า: "Honda", isuzu: "Isuzu", อีซูซุ: "Isuzu",
  ford: "Ford", ฟอร์ด: "Ford", mazda: "Mazda", มาสด้า: "Mazda", nissan: "Nissan", นิสสัน: "Nissan",
  mitsubishi: "Mitsubishi", มิตซู: "Mitsubishi", hyundai: "Hyundai", ฮุนได: "Hyundai", byd: "BYD", บีวายดี: "BYD",
  mg: "MG", เอ็มจี: "MG", suzuki: "Suzuki", ซูซูกิ: "Suzuki", mercedes: "Mercedes-Benz", เบนซ์: "Mercedes-Benz", bmw: "BMW",
};
const BODY: [RegExp, BodyType][] = [
  [/กระบะ|ปิคอัพ|pickup/, "pickup"], [/รถตู้|ตู้|mpv|7\s*ที่นั่ง/, "van"], [/เก๋ง|ซีดาน|sedan/, "sedan"],
  [/suv|ppv|อเนกประสงค์|เอสยูวี/, "suv"], [/แฮทช์แบ็ก|แฮทช์|hatch|ห้าประตู/, "hatch"],
];
const FUEL: [RegExp, string][] = [[/ไฟฟ้า|\bev\b/, "ไฟฟ้า"], [/ดีเซล/, "ดีเซล"], [/เบนซิน/, "เบนซิน"], [/ไฮบริด|hybrid|hev/, "ไฮบริด"]];
const FILLER = /^(รถ|หา|อยาก|ได้|อยากได้|ที่|คัน|ราคา|บาท|แถว|ใน|และ|กับ|ประตู|\d|ขอ|ครับ|ค่ะ|หน่อย|ไม่เกิน|เดือน|เดือนละ|ต่อเดือน|ใกล้|รอบๆ)$/;

export function parseAsk(raw: string): Ask {
  let s = ` ${raw.toLowerCase().replace(/,/g, "")} `;
  const a: Ask = {};
  const cut = (re: RegExp) => { const m = s.match(re); if (m) s = s.replace(m[0], " "); return m; };
  const pay = (k: "any" | "freeDown" | "inhouse") => { a.pays ??= []; if (!a.pays.includes(k)) a.pays.push(k); };
  let m: RegExpMatchArray | null;
  if (cut(/ฟรีดาวน์|ไม่ต้องดาวน์|ไม่มีเงินดาวน์|ดาวน์\s*0(?!\d)/)) pay("freeDown");
  if (cut(/ผ่อนกับร้าน|ผ่อนร้าน|ผ่อนกับเต็นท์|ไม่เช็คบูโร|ไม่ผ่านไฟแนนซ์|ติดบูโร/)) pay("inhouse");
  if ((m = cut(/ดาวน์\s*(?:ไม่เกิน)?\s*(\d+(?:\.\d+)?)\s*(ล้าน|แสน|หมื่น|พัน)?/))) { a.maxDown = Math.round(+m[1] * (UNIT[m[2]] || 1)); pay("any"); }
  if ((m = cut(/ผ่อน\s*(?:ไม่เกิน)?\s*(?:เดือนละ)?\s*(\d+(?:\.\d+)?)\s*(หมื่น|พัน)?/))) { a.maxMonthly = Math.round(+m[1] * (UNIT[m[2]] || 1)); pay("any"); }
  if (cut(/ผ่อนได้|รับผ่อน|ไฟแนนซ์|ผ่อน/)) pay("any");
  if ((m = cut(/(?:งบ|ไม่เกิน|ต่ำกว่า|ราคา)?\s*(\d+(?:\.\d+)?)\s*(ล้าน|แสน|หมื่น)/))) a.maxPrice = Math.round(+m[1] * UNIT[m[2]]);
  else if ((m = cut(/(?:งบ|ไม่เกิน|ต่ำกว่า)\s*(\d{5,7})/))) a.maxPrice = +m[1];
  if ((m = cut(/ปี\s*((?:19|20)\d\d)\s*(?:ขึ้นไป)?/))) a.minYear = +m[1];
  if (cut(/มือสอง|มือ\s*2|ใช้แล้ว/)) a.cond = "used";
  if (cut(/ป้ายแดง|รถใหม่|มือหนึ่ง|มือ\s*1/)) a.cond = "new";
  if (cut(/ตรวจแล้ว|ผ่านตรวจ|ตรวจสภาพ/)) a.inspected = true;
  for (const [re, t] of BODY) if (cut(re)) (a.body ??= []).push(t);
  for (const [re, f] of FUEL) if (cut(re)) (a.fuels ??= []).push(f);
  for (const [w, b] of Object.entries(BRANDS)) if (s.includes(w)) { a.brand = b; s = s.replace(w, " "); }
  a.near = /ใกล้|แถว|รอบๆ/.test(s);
  const p = provinceFromText(s);
  if (p) { a.province = p; for (const w of [provShort(p), "อยุธยา", "กทม", "กรุงเทพ"]) s = s.split(w).join(" "); }
  const rest = s.split(/\s+/).filter((t) => t.length > 1 && !FILLER.test(t));
  if (rest.length) a.words = rest;
  return a;
}

export function askLabels(a: Ask): string[] {
  const out: string[] = [];
  if (a.cond) out.push(a.cond === "new" ? "รถใหม่ป้ายแดง" : "รถมือสอง");
  if (a.body) out.push(...a.body.map((b) => ({ sedan: "เก๋ง", hatch: "แฮทช์แบ็ก", suv: "SUV/PPV", pickup: "กระบะ", van: "รถตู้" })[b]));
  if (a.brand) out.push(a.brand);
  if (a.fuels) out.push(...a.fuels);
  if (a.maxPrice) out.push(`ไม่เกิน ฿${baht(a.maxPrice)}`);
  if (a.minYear) out.push(`ปี ${a.minYear} ขึ้นไป`);
  if (a.province) out.push((a.near && NEAR[a.province] ? "ใกล้" : "") + provShort(a.province));
  if (a.inspected) out.push("ผ่านตรวจสภาพ");
  if (a.pays) out.push(...a.pays.filter((k) => k !== "any" || a.pays!.length === 1).map((k) => ({ any: "ผ่อนได้", freeDown: "ฟรีดาวน์", inhouse: "ผ่อนกับร้าน" })[k]));
  if (a.maxDown) out.push(`ดาวน์ไม่เกิน ฿${baht(a.maxDown)}`);
  if (a.maxMonthly) out.push(`ผ่อนไม่เกิน ฿${baht(a.maxMonthly)}/เดือน`);
  if (a.words) out.push(`“${a.words.join(" ")}”`);
  return out;
}

/** Filters that the database query cannot express; applied after fetching. */
export function matchesAsk(l: Listing, a: Ask): boolean {
  return (!a.brand || l.brand === a.brand) &&
    (!a.fuels || a.fuels.includes(l.fuel)) &&
    (!a.inspected || l.inspected) &&
    (!a.pays || a.pays.every((k) => (k === "any" ? canFinance(l) : k === "freeDown" ? l.pay.freeDown : l.pay.inhouse))) &&
    (!a.maxDown || (canFinance(l) && downOf(l) <= a.maxDown)) &&
    (!a.maxMonthly || (canFinance(l) && monthlyOf(l) <= a.maxMonthly)) &&
    (!a.words || a.words.every((w) => slugify(`${l.brand} ${l.model} ${l.trim}`).includes(slugify(w))));
}

export const askProvinces = (a: Ask) => (a.province ? (a.near && NEAR[a.province]) || [a.province] : undefined);
