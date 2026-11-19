import type { BodyType } from "./types";
import { slugify } from "./seo";

/**
 * New-car price catalog (ราคารถใหม่). This is NOT a list of cars for sale: nobody is selling these on Tops Car.
 * It shows the manufacturer-recommended price ranges collected from Thai car-price sites, so buyers can compare,
 * then jump to real listings from dealers who joined us. Prices are in thousand baht in the source rows below.
 *
 * To update: edit the rows, change CATALOG_AS_OF, push. A model with only `from` has a single price we could confirm.
 * Models we could not confirm a price for are left out on purpose (better missing than wrong).
 */
export const CATALOG_AS_OF = "พฤศจิกายน 2569";
export const CATALOG_SOURCES = [
  { name: "Zigwheels Thailand", url: "https://www.zigwheels.co.th/en/new-cars" },
  { name: "Car250", url: "https://www.car250.com" },
  { name: "9CarThai", url: "https://www.9carthai.com" },
];

export type CatalogModel = { brand: string; model: string; body: BodyType; fuel?: string; from: number; to?: number };
export type CatalogBrand = { name: string; slug: string; models: CatalogModel[] };

type Row = [model: string, body: BodyType, fuel: string, fromK: number, toK?: number];
const BRANDS: Record<string, Row[]> = {
  Toyota: [
    ["Yaris", "hatch", "เบนซิน", 584, 689],
    ["Yaris Ativ", "sedan", "เบนซิน/ไฮบริด", 569, 729],
    ["Yaris Cross", "suv", "ไฮบริด", 809, 929],
    ["Corolla Altis", "sedan", "เบนซิน/ไฮบริด", 909, 1129],
    ["Corolla Cross", "suv", "ไฮบริด", 989, 1254],
    ["Camry", "sedan", "ไฮบริด", 1475, 1809],
    ["Veloz", "van", "เบนซิน", 795, 875],
    ["Innova Zenix", "van", "", 1379, 1489],
    ["Fortuner", "suv", "ดีเซล", 1239, 1969],
    ["Land Cruiser FJ", "suv", "", 1269],
    ["bZ4X", "suv", "ไฟฟ้า", 1529, 1649],
    ["Hilux Champ", "pickup", "ดีเซล", 519, 615],
    ["Hilux Revo", "pickup", "ดีเซล", 584, 1252],
    ["Hilux Travo", "pickup", "ดีเซล", 767, 1366],
    ["Hilux Travo-e", "pickup", "ไฟฟ้า", 1491],
    ["Commuter", "van", "ดีเซล", 1339, 1369],
    ["Hiace", "van", "ดีเซล", 1069, 1204],
    ["Majesty", "van", "ดีเซล", 1994, 2339],
    ["Alphard", "van", "", 4269, 4639],
  ],
  Honda: [
    ["City", "sedan", "เบนซิน/ไฮบริด", 569, 739],
    ["City Hatchback", "hatch", "เบนซิน/ไฮบริด", 729, 799],
    ["Civic", "sedan", "เบนซิน/ไฮบริด", 949, 1239],
    ["Accord", "sedan", "ไฮบริด", 1479, 1729],
    ["HR-V", "suv", "ไฮบริด", 949, 1179],
    ["WR-V", "suv", "เบนซิน", 799, 869],
    ["BR-V", "suv", "เบนซิน", 915, 973],
    ["CR-V", "suv", "เบนซิน/ไฮบริด", 1399, 1729],
    ["e:N1", "suv", "ไฟฟ้า", 1199],
    ["e:N2", "suv", "ไฟฟ้า", 1429],
    ["Step WGN", "van", "ไฮบริด", 1780],
  ],
  Isuzu: [
    ["D-Max Spark", "pickup", "ดีเซล", 558, 780],
    ["D-Max 2 Door", "pickup", "ดีเซล", 668, 885],
    ["D-Max 4 Door", "pickup", "ดีเซล", 749, 1184],
    ["X-Series", "pickup", "ดีเซล", 768, 1041],
    ["V-Cross 4x4", "pickup", "ดีเซล", 937, 1297],
    ["D-Max EV", "pickup", "ไฟฟ้า", 1591],
    ["MU-X", "suv", "ดีเซล", 1194, 1759],
  ],
  Mitsubishi: [
    ["Mirage", "hatch", "เบนซิน", 509, 579],
    ["Attrage", "sedan", "เบนซิน", 564, 619],
    ["Xpander", "van", "เบนซิน", 799, 912],
    ["Xpander HEV", "van", "ไฮบริด", 933, 981],
    ["Xpander Cross", "van", "เบนซิน", 946],
    ["Xpander Cross HEV", "van", "ไฮบริด", 961, 981],
    ["Xforce HEV", "suv", "ไฮบริด", 899, 1089],
    ["Pajero Sport", "suv", "ดีเซล", 1389, 1689],
    ["Triton", "pickup", "ดีเซล", 622, 1299],
  ],
  Nissan: [
    ["Almera", "sedan", "เบนซิน", 573, 699],
    ["Kicks e-Power", "suv", "ไฮบริด", 850, 920],
    ["X-Trail e-Power", "suv", "ไฮบริด", 1699],
    ["Terra", "suv", "ดีเซล", 1199, 1555],
    ["Serena", "van", "เบนซิน", 1469],
    ["Serena e-Power", "van", "ไฮบริด", 1690],
    ["Leaf", "hatch", "ไฟฟ้า", 1590],
    ["Navara", "pickup", "ดีเซล", 605, 1175],
  ],
  Mazda: [
    ["Mazda2 Sedan", "sedan", "เบนซิน/ดีเซล", 529, 749],
    ["Mazda2 Hatchback", "hatch", "เบนซิน/ดีเซล", 529, 749],
    ["Mazda3 Sedan", "sedan", "เบนซิน", 979, 1210],
    ["Mazda3 Fastback", "hatch", "เบนซิน", 979, 1210],
    ["Mazda6", "sedan", "เบนซิน", 2499],
    ["Mazda 6e", "sedan", "ไฟฟ้า", 1169],
    ["CX-3", "suv", "เบนซิน", 770, 970],
    ["CX-30", "suv", "เบนซิน", 989, 1211],
    ["CX-5", "suv", "เบนซิน/ดีเซล", 1219, 1669],
    ["CX-8", "suv", "เบนซิน/ดีเซล", 1549, 2199],
    ["BT-50", "pickup", "ดีเซล", 762, 1352],
  ],
  Ford: [
    ["Ranger", "pickup", "ดีเซล", 732, 1534],
    ["Ranger Super Duty", "pickup", "ดีเซล", 1599],
    ["Ranger Raptor", "pickup", "ดีเซล", 1984],
    ["Everest", "suv", "ดีเซล", 1379, 2284],
  ],
  Suzuki: [
    ["Celerio", "hatch", "เบนซิน", 320, 400],
    ["Swift", "hatch", "เบนซิน", 567, 637],
    ["Fronx", "suv", "เบนซิน", 689, 799],
    ["XL7 Hybrid", "van", "ไฮบริด", 799],
    ["Jimny", "suv", "เบนซิน", 1450, 1480],
    ["Carry", "pickup", "เบนซิน", 395],
  ],
  MG: [
    ["MG3 Hybrid+", "hatch", "ไฮบริด", 580, 620],
    ["MG5", "sedan", "เบนซิน", 590, 670],
    ["MG ZS", "suv", "เบนซิน", 599, 689],
    ["MG VS HEV", "suv", "ไฮบริด", 699, 790],
    ["MG HS", "suv", "เบนซิน", 939, 1379],
    ["MG Urban", "hatch", "ไฟฟ้า", 530, 710],
    ["MG4 Electric", "hatch", "ไฟฟ้า", 710, 1120],
    ["MG ZS EV", "suv", "ไฟฟ้า", 830, 900],
    ["MG S5 EV", "suv", "ไฟฟ้า", 740, 950],
    ["MG IM5", "sedan", "ไฟฟ้า", 1450],
    ["MG IM6", "suv", "ไฟฟ้า", 1400, 1800],
    ["MG EP Plus", "van", "ไฟฟ้า", 771],
    ["Maxus 7", "van", "ไฟฟ้า", 1769],
    ["Maxus 9", "van", "ไฟฟ้า", 2499, 2699],
    ["Extender GC", "pickup", "ดีเซล", 589, 739],
    ["Extender DC", "pickup", "ดีเซล", 769, 1039],
  ],
  BYD: [
    ["Atto 1", "hatch", "ไฟฟ้า", 430, 460],
    ["Atto 2", "suv", "ไฟฟ้า", 630, 660],
    ["Atto 3", "suv", "ไฟฟ้า", 700],
    ["Seal 5 DM-i", "sedan", "ปลั๊กอินไฮบริด", 600, 700],
    ["Seal", "sedan", "ไฟฟ้า", 990, 1000],
    ["Sealion 7", "suv", "ไฟฟ้า", 1200, 1300],
    ["M6", "van", "ไฟฟ้า", 800, 900],
    ["Denza D9", "van", "ไฟฟ้า", 1950, 2400],
  ],
  Jaecoo: [
    ["Jaecoo 5 EV", "suv", "ไฟฟ้า", 549],
    ["Jaecoo 6", "suv", "ไฟฟ้า", 1099],
    ["Jaecoo 6T REEV", "suv", "ไฮบริด", 900, 1000],
  ],
  Omoda: [["Omoda C5", "suv", "ไฟฟ้า", 629]],
  GWM: [
    ["Ora Good Cat", "hatch", "ไฟฟ้า", 599],
    ["Ora Good Cat GT", "hatch", "ไฟฟ้า", 1099],
    ["Ora 5", "suv", "ไฟฟ้า", 669],
    ["Ora 07", "sedan", "ไฟฟ้า", 1299],
  ],
  Geely: [
    ["Geely EX5", "suv", "ไฟฟ้า", 799],
    ["Starray EM-R", "suv", "ปลั๊กอินไฮบริด", 700, 800],
  ],
  Zeekr: [["Zeekr X", "suv", "ไฟฟ้า", 1199]],
  Deepal: [
    ["Deepal S05", "suv", "ไฟฟ้า", 799],
    ["Deepal L07", "sedan", "ไฟฟ้า", 1079],
    ["Deepal S07", "suv", "ไฟฟ้า", 1119],
  ],
  Aion: [["Aion Y Plus", "suv", "ไฟฟ้า", 770]],
  Lepas: [["Lepas L6", "sedan", "", 770, 830]],
  Hyundai: [
    ["Stargazer", "van", "เบนซิน", 769, 889],
    ["Creta", "suv", "เบนซิน", 929],
    ["Creta N Line", "suv", "เบนซิน", 1199],
    ["Santa Fe", "suv", "ไฮบริด", 1599, 1749],
    ["Ioniq 5", "suv", "ไฟฟ้า", 1399],
    ["Ioniq 5 N Line", "suv", "ไฟฟ้า", 1699],
    ["Ioniq 6", "sedan", "ไฟฟ้า", 1899],
    ["Staria", "van", "", 1659, 2419],
  ],
  Kia: [
    ["EV5", "suv", "ไฟฟ้า", 1399],
    ["Carnival", "van", "", 2234, 2990],
    ["EV9", "suv", "ไฟฟ้า", 3499, 3899],
  ],
  Subaru: [
    ["Forester", "suv", "", 1185, 1285],
    ["Outback", "suv", "", 2565],
    ["WRX", "sedan", "", 2975, 3275],
  ],
  Lexus: [
    ["LBX", "suv", "", 2229, 2390],
    ["UX", "suv", "", 2670, 3300],
    ["NX", "suv", "", 3310, 4390],
    ["IS", "sedan", "", 2690, 3890],
    ["ES", "sedan", "", 3625],
    ["RZ", "suv", "ไฟฟ้า", 3870, 4190],
    ["LM", "van", "", 6290, 7590],
    ["LS", "sedan", "", 11900, 15200],
  ],
  Volvo: [
    ["EX30", "suv", "ไฟฟ้า", 1590],
    ["EX40", "suv", "ไฟฟ้า", 1890],
    ["EC40", "suv", "ไฟฟ้า", 1990, 2790],
    ["ES90", "sedan", "ไฟฟ้า", 2990],
    ["XC60", "suv", "", 3390],
    ["EX90", "suv", "ไฟฟ้า", 4290, 4890],
    ["XC90", "suv", "", 4690],
  ],
};

export const CATALOG: CatalogBrand[] = Object.entries(BRANDS).map(([name, rows]) => ({
  name,
  slug: slugify(name),
  models: rows
    .map(([model, body, fuel, f, t]): CatalogModel => ({
      brand: name, model, body, fuel: fuel || undefined, from: Math.round(f * 1000), to: t && t !== f ? Math.round(t * 1000) : undefined,
    }))
    .sort((a, b) => a.from - b.from),
}));

export const modelSlug = (m: { model: string }) => slugify(m.model);
export const brandBySlug = (s: string) => CATALOG.find((b) => b.slug === s);
export const modelBySlug = (b: CatalogBrand, s: string) => b.models.find((m) => modelSlug(m) === s);
export const catalogCount = () => CATALOG.reduce((n, b) => n + b.models.length, 0);
export const priceText = (m: { from: number; to?: number }, fmt: (n: number) => string) =>
  m.to ? `${fmt(m.from)} - ${fmt(m.to)} บาท` : `${fmt(m.from)} บาท`;

export const catalogPath = (brand?: string, model?: string) =>
  `/new-car-prices${brand ? `/${slugify(brand)}${model ? `/${slugify(model)}` : ""}` : ""}`;
