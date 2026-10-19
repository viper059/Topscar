export type Cond = "new" | "used";
export type BodyType = "sedan" | "hatch" | "suv" | "pickup" | "van";

export type Pay = {
  cash: boolean;
  finance: boolean;
  inhouse: boolean;
  freeDown: boolean;
  down?: number | null;
  monthly?: number | null;
  months?: number | null;
  rate?: number | null;
};

export type Listing = {
  id: string; // short id used in URLs
  cond: Cond;
  brand: string;
  model: string;
  trim: string;
  year: number;
  km: number;
  price: number;
  mkt?: number | null; // estimated market price for the same model/year/km
  body: BodyType;
  fuel: string;
  gear: string;
  province: string; // slug
  color: string;
  inspected: boolean;
  pay: Pay;
  photos: { url: string; alt: string }[];
  status: "active" | "sold";
  postedAt: string;
  promo?: { kind: "bump" | "feature" | "home"; endsAt: string } | null;
  seller: { name: string; type: "private" | "tent" | "dealer"; verified: boolean; shopName?: string | null };
};

export const BODY_TH: Record<BodyType, string> = {
  sedan: "รถเก๋ง", hatch: "แฮทช์แบ็ก", suv: "SUV/PPV", pickup: "รถกระบะ", van: "รถตู้/MPV",
};
export const SELLER_TH = { private: "รถบ้าน", tent: "เต็นท์รถ", dealer: "ดีลเลอร์" } as const;
