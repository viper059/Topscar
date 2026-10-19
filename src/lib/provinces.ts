// Thai provinces with URL slugs (English slugs stay readable when links are shared in LINE / Facebook).
export const PROVINCES: Record<string, string> = {
  bangkok: "กรุงเทพมหานคร", krabi: "กระบี่", kanchanaburi: "กาญจนบุรี", kalasin: "กาฬสินธุ์",
  "kamphaeng-phet": "กำแพงเพชร", "khon-kaen": "ขอนแก่น", chanthaburi: "จันทบุรี", chachoengsao: "ฉะเชิงเทรา",
  chonburi: "ชลบุรี", "chai-nat": "ชัยนาท", chaiyaphum: "ชัยภูมิ", chumphon: "ชุมพร", "chiang-rai": "เชียงราย",
  "chiang-mai": "เชียงใหม่", trang: "ตรัง", trat: "ตราด", tak: "ตาก", "nakhon-nayok": "นครนายก",
  "nakhon-pathom": "นครปฐม", "nakhon-phanom": "นครพนม", "nakhon-ratchasima": "นครราชสีมา",
  "nakhon-si-thammarat": "นครศรีธรรมราช", "nakhon-sawan": "นครสวรรค์", nonthaburi: "นนทบุรี",
  narathiwat: "นราธิวาส", nan: "น่าน", "bueng-kan": "บึงกาฬ", buriram: "บุรีรัมย์", "pathum-thani": "ปทุมธานี",
  "prachuap-khiri-khan": "ประจวบคีรีขันธ์", "prachin-buri": "ปราจีนบุรี", pattani: "ปัตตานี",
  ayutthaya: "พระนครศรีอยุธยา", phayao: "พะเยา", "phang-nga": "พังงา", phatthalung: "พัทลุง",
  phichit: "พิจิตร", phitsanulok: "พิษณุโลก", phetchaburi: "เพชรบุรี", phetchabun: "เพชรบูรณ์", phrae: "แพร่",
  phuket: "ภูเก็ต", "maha-sarakham": "มหาสารคาม", mukdahan: "มุกดาหาร", "mae-hong-son": "แม่ฮ่องสอน",
  yasothon: "ยโสธร", yala: "ยะลา", "roi-et": "ร้อยเอ็ด", ranong: "ระนอง", rayong: "ระยอง", ratchaburi: "ราชบุรี",
  lopburi: "ลพบุรี", lampang: "ลำปาง", lamphun: "ลำพูน", loei: "เลย", sisaket: "ศรีสะเกษ",
  "sakon-nakhon": "สกลนคร", songkhla: "สงขลา", satun: "สตูล", "samut-prakan": "สมุทรปราการ",
  "samut-songkhram": "สมุทรสงคราม", "samut-sakhon": "สมุทรสาคร", "sa-kaeo": "สระแก้ว", saraburi: "สระบุรี",
  "sing-buri": "สิงห์บุรี", sukhothai: "สุโขทัย", "suphan-buri": "สุพรรณบุรี", "surat-thani": "สุราษฎร์ธานี",
  surin: "สุรินทร์", "nong-khai": "หนองคาย", "nong-bua-lamphu": "หนองบัวลำภู", "ang-thong": "อ่างทอง",
  "amnat-charoen": "อำนาจเจริญ", "udon-thani": "อุดรธานี", uttaradit: "อุตรดิตถ์", "uthai-thani": "อุทัยธานี",
  "ubon-ratchathani": "อุบลราชธานี",
};

/** Short Thai names people actually type and read. */
export const SHORT: Record<string, string> = { ayutthaya: "อยุธยา", bangkok: "กรุงเทพฯ" };
export const provName = (slug: string) => PROVINCES[slug] ?? slug;
export const provShort = (slug: string) => SHORT[slug] ?? provName(slug);

/** Neighbouring provinces, used for "ใกล้อยุธยา"-style searches. Extend as the site grows. */
export const NEAR: Record<string, string[]> = {
  ayutthaya: ["ayutthaya", "ang-thong", "saraburi", "pathum-thani", "lopburi", "sing-buri", "suphan-buri"],
  bangkok: ["bangkok", "nonthaburi", "pathum-thani", "samut-prakan", "nakhon-pathom", "samut-sakhon"],
};

/** Thai words (full name, short name, common spellings) → slug. */
export function provinceFromText(text: string): string | null {
  const extra: Record<string, string> = { "อยุธยา": "ayutthaya", "กทม": "bangkok", "กรุงเทพ": "bangkok", "โคราช": "nakhon-ratchasima", "ปทุม": "pathum-thani" };
  for (const [w, s] of Object.entries(extra)) if (text.includes(w)) return s;
  for (const [s, name] of Object.entries(PROVINCES))
    if (text.includes(name) || new RegExp(`\\b${s.replace(/-/g, "[ -]")}\\b`).test(text)) return s;
  return null;
}
