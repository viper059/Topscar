import type { Listing, Pay } from "./types";

// Sample listings used when Supabase is not configured (local dev, first deploy).
const pay = (p: Partial<Pay> = {}): Pay => ({ cash: true, finance: true, inhouse: false, freeDown: false, ...p });
const daysAgo = (d: number) => new Date(Date.now() - d * 864e5).toISOString();
const dealer = (name: string) => ({ name, type: "dealer" as const, verified: true, shopName: name });
const tent = (name: string) => ({ name, type: "tent" as const, verified: true, shopName: name });
const owner = (name: string, verified = false) => ({ name, type: "private" as const, verified });

type Row = Omit<Listing, "photos" | "status" | "postedAt"> & { age: number };
const ROWS: Row[] = [
  { id: "a1x7k2", cond: "new", brand: "Toyota", model: "Yaris Ativ", trim: "1.2 Premium Luxury", year: 2026, km: 0, price: 609000, body: "sedan", fuel: "เบนซิน", gear: "CVT", province: "bangkok", color: "#c9302c", inspected: true, pay: pay({ freeDown: true, monthly: 8900, months: 84, rate: 1.99 }), seller: dealer("Toyota ตัวอย่าง กรุงเทพ"), age: 2 },
  { id: "b4m9q1", cond: "new", brand: "Honda", model: "City", trim: "e:HEV RS", year: 2026, km: 0, price: 739000, body: "sedan", fuel: "ไฮบริด", gear: "e-CVT", province: "nonthaburi", color: "#cfd3d8", inspected: true, pay: pay(), seller: dealer("Honda ตัวอย่าง นนทบุรี"), age: 4 },
  { id: "c8d2r5", cond: "new", brand: "Isuzu", model: "D-Max Hi-Lander", trim: "4 ประตู 1.9 Ddi Z", year: 2026, km: 0, price: 859000, body: "pickup", fuel: "ดีเซล", gear: "AT", province: "ayutthaya", color: "#2f4a6d", inspected: true, pay: pay({ down: 85900, monthly: 11500, months: 84 }), seller: dealer("Isuzu ตัวอย่าง อยุธยา"), age: 1 },
  { id: "d2n6w8", cond: "new", brand: "BYD", model: "Atto 3", trim: "Extended Range", year: 2026, km: 0, price: 899900, body: "suv", fuel: "ไฟฟ้า", gear: "AT", province: "bangkok", color: "#4f7f7a", inspected: true, pay: pay(), seller: dealer("BYD ตัวอย่าง"), age: 6 },
  { id: "e5t3y9", cond: "new", brand: "Toyota", model: "Commuter", trim: "2.8 MT หลังคาสูง", year: 2026, km: 0, price: 1409000, body: "van", fuel: "ดีเซล", gear: "MT", province: "ayutthaya", color: "#e6e7e9", inspected: true, pay: pay({ down: 281800, monthly: 16900, months: 84 }), seller: dealer("Toyota ตัวอย่าง อยุธยา"), age: 3 },
  { id: "f7h1u4", cond: "new", brand: "MG", model: "MG4 Electric", trim: "X", year: 2026, km: 0, price: 869900, body: "hatch", fuel: "ไฟฟ้า", gear: "AT", province: "chonburi", color: "#e8a317", inspected: true, pay: pay({ freeDown: true }), seller: dealer("MG ตัวอย่าง ชลบุรี"), age: 8 },
  { id: "g3k8p6", cond: "used", brand: "Toyota", model: "Hilux Revo", trim: "Rocco 2.4 Double Cab", year: 2021, km: 68000, price: 689000, mkt: 725000, body: "pickup", fuel: "ดีเซล", gear: "AT", province: "bangkok", color: "#b8bcc2", inspected: true, pay: pay({ down: 99000, monthly: 10900, months: 72, rate: 3.99 }), seller: tent("เต็นท์ตัวอย่าง รามอินทรา"), age: 5 },
  { id: "h9v2c3", cond: "used", brand: "Honda", model: "Civic", trim: "1.5 Turbo RS", year: 2020, km: 72000, price: 789000, mkt: 770000, body: "sedan", fuel: "เบนซิน", gear: "CVT", province: "nonthaburi", color: "#2a3d66", inspected: false, pay: pay({ finance: false }), seller: owner("คุณเอ"), age: 9 },
  { id: "j6b5n7", cond: "used", brand: "Toyota", model: "Commuter", trim: "3.0 D4D แต่ง VIP", year: 2018, km: 145000, price: 729000, mkt: 690000, body: "van", fuel: "ดีเซล", gear: "MT", province: "ayutthaya", color: "#e3e3e3", inspected: true, pay: pay({ inhouse: true, down: 150000, monthly: 15500, months: 48 }), seller: owner("คุณบี", true), age: 2 },
  { id: "k1q4z8", cond: "used", brand: "Mazda", model: "Mazda2", trim: "1.3 Skyactiv Sports", year: 2019, km: 88000, price: 299000, mkt: 325000, body: "hatch", fuel: "เบนซิน", gear: "AT", province: "pathum-thani", color: "#8c1d24", inspected: false, pay: pay({ finance: false, inhouse: true, down: 30000, monthly: 7900, months: 48 }), seller: tent("เต็นท์ตัวอย่าง รังสิต"), age: 11 },
  { id: "m8w7e2", cond: "used", brand: "Ford", model: "Ranger", trim: "Wildtrak 2.0 Bi-Turbo", year: 2022, km: 41000, price: 899000, mkt: 905000, body: "pickup", fuel: "ดีเซล", gear: "AT", province: "chonburi", color: "#c4632b", inspected: true, pay: pay({ down: 179000 }), seller: tent("เต็นท์ตัวอย่าง ชลบุรี"), age: 7 },
  { id: "n2r9t5", cond: "used", brand: "Toyota", model: "Yaris Ativ", trim: "1.2 Sport", year: 2022, km: 39000, price: 439000, mkt: 445000, body: "sedan", fuel: "เบนซิน", gear: "CVT", province: "ayutthaya", color: "#5b6470", inspected: true, pay: pay(), seller: owner("คุณซี"), age: 4 },
  { id: "p5y3g1", cond: "used", brand: "Hyundai", model: "H-1", trim: "2.5 Elite", year: 2017, km: 132000, price: 699000, mkt: 640000, body: "van", fuel: "ดีเซล", gear: "AT", province: "saraburi", color: "#3b3b3f", inspected: false, pay: pay({ finance: false }), seller: tent("เต็นท์ตัวอย่าง สระบุรี"), age: 13 },
  { id: "q7u6h4", cond: "used", brand: "BYD", model: "Dolphin", trim: "Extended Range", year: 2024, km: 18000, price: 529000, mkt: 560000, body: "hatch", fuel: "ไฟฟ้า", gear: "AT", province: "bangkok", color: "#9fc3d6", inspected: true, pay: pay(), seller: owner("คุณดี", true), age: 3 },
  { id: "r3i8j9", cond: "used", brand: "Isuzu", model: "MU-X", trim: "1.9 Active", year: 2021, km: 62000, price: 869000, mkt: 880000, body: "suv", fuel: "ดีเซล", gear: "AT", province: "nakhon-pathom", color: "#6c7178", inspected: true, pay: pay(), seller: tent("เต็นท์ตัวอย่าง นครปฐม"), age: 6 },
  { id: "s4o1l6", cond: "used", brand: "Nissan", model: "Almera", trim: "1.0 Turbo VL", year: 2020, km: 76000, price: 359000, mkt: 365000, body: "sedan", fuel: "เบนซิน", gear: "CVT", province: "ang-thong", color: "#dcdde0", inspected: false, pay: pay({ freeDown: true, monthly: 6900, months: 72 }), seller: owner("คุณอี"), age: 10 },
];

export const SEED: Listing[] = ROWS.map(({ age, ...r }, i) => ({
  ...r,
  photos: [],
  status: "active",
  postedAt: daysAgo(age),
  promo: i === 8 ? { kind: "feature", endsAt: daysAgo(-5) } : i === 10 ? { kind: "bump", endsAt: daysAgo(-1) } : null,
}));
