"use client";
import { useEffect, useMemo, useState } from "react";
import { sb, PHOTO_BUCKET } from "@/lib/supabase-browser";
import { PROVINCES } from "@/lib/provinces";
import { BODY_TH, type BodyType } from "@/lib/types";
import { MAX_PHOTOS, shrinkPhoto } from "@/lib/photos";
import { baht } from "@/lib/money";

const BRANDS = ["Toyota", "Isuzu", "Honda", "Mitsubishi", "Nissan", "Mazda", "Ford", "MG", "BYD", "Suzuki", "Hyundai", "Mercedes-Benz", "BMW", "Chevrolet", "Kia", "GWM", "Neta", "Volvo"];
const FUELS = ["ดีเซล", "เบนซิน", "ไฮบริด", "ไฟฟ้า", "แก๊ส LPG/NGV"];
const GEARS = ["AT", "MT", "CVT"];

type Photo = { file: File; url: string };

export default function SellForm({ userId, province, plan }: { userId: string; province: string; plan: string }) {
  const [cond, setCond] = useState<"used" | "new">("used");
  const [payMode, setPayMode] = useState<"fin" | "cash">("fin");
  const [freeDown, setFreeDown] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [price, setPrice] = useState("");

  useEffect(() => () => photos.forEach((p) => URL.revokeObjectURL(p.url)), [photos]);

  function addPhotos(list: FileList | null) {
    if (!list) return;
    const add = [...list].filter((f) => f.type.startsWith("image/")).slice(0, MAX_PHOTOS - photos.length);
    setPhotos((p) => [...p, ...add.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
  }
  const move = (i: number, d: number) => setPhotos((p) => { const a = [...p]; const j = i + d; if (j < 0 || j >= a.length) return a; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const remove = (i: number) => setPhotos((p) => p.filter((_, k) => k !== i));
  const priceN = useMemo(() => Number(price) || 0, [price]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!photos.length) return setErr("ใส่รูปรถอย่างน้อย 1 รูป");
    const f = new FormData(e.currentTarget);
    const s = (k: string) => String(f.get(k) ?? "").trim();
    const n = (k: string) => (s(k) === "" ? null : Number(s(k)));
    const cash = payMode === "cash";
    const fin = !cash && f.get("pay_finance") === "on", inhouse = !cash && f.get("pay_inhouse") === "on";
    if (!cash && !fin && !inhouse) return setErr("เลือกอย่างน้อย 1 แบบ: ผ่อนผ่านไฟแนนซ์ หรือผ่อนกับร้าน");
    if (!s("phone") && !s("line")) return setErr("ใส่เบอร์โทรหรือ LINE ID อย่างน้อย 1 อย่าง");

    const db = sb();
    try {
      setBusy("กำลังบันทึกข้อมูลรถ…");
      const { data: row, error } = await db.from("listings").insert({
        owner_id: userId, status: "hidden", cond, brand: s("brand"), model: s("model"), trim_name: s("trim"),
        year: n("year"), km: cond === "new" ? 0 : n("km") ?? 0, price: n("price"), body_type: s("body"),
        fuel: s("fuel"), gear: s("gear"), province: s("province"), color: s("color") || "#d8dbe0",
        pay_cash: true, pay_finance: fin, pay_inhouse: inhouse, pay_free_down: !cash && freeDown,
        pay_down: cash || freeDown ? null : n("down"), pay_monthly: cash ? null : n("monthly"),
        pay_months: cash ? null : n("months"), pay_rate: cash ? null : n("rate"),
      }).select("id, short_id").single();
      if (error) throw new Error(error.message.includes("too_many_drafts") ? "มีประกาศที่ยังลงไม่เสร็จค้างอยู่มากเกินไป ลบในหน้าบัญชีของฉันก่อน" : error.message);

      const { error: cErr } = await db.from("listing_contacts").insert({ listing_id: row.id, phone: s("phone") || null, line_id: s("line") || null });
      if (cErr) throw new Error(cErr.message);

      const title = `${s("brand")} ${s("model")} ${s("year")}`;
      for (let i = 0; i < photos.length; i++) {
        setBusy(`กำลังอัปโหลดรูป ${i + 1}/${photos.length}…`);
        const blob = await shrinkPhoto(photos[i].file);
        const ext = blob.type === "image/webp" ? "webp" : "jpg";
        const path = `${userId}/${row.short_id}/${String(i + 1).padStart(2, "0")}.${ext}`;
        const up = await db.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type, upsert: false, cacheControl: "31536000" });
        if (up.error) throw new Error(`อัปโหลดรูปที่ ${i + 1} ไม่สำเร็จ: ${up.error.message}`);
        const { error: pErr } = await db.from("listing_photos").insert({ listing_id: row.id, r2_key: path, alt: `${title} รูปที่ ${i + 1}`, position: i });
        if (pErr) throw new Error(pErr.message);
      }

      setBusy("กำลังเปิดประกาศ…");
      const { error: aErr } = await db.from("listings").update({ status: "active" }).eq("id", row.id);
      if (aErr) {
        const cap = /listing_cap_reached:(\d+)/.exec(aErr.message)?.[1];
        throw new Error(cap ? `แพ็กเกจของคุณลงพร้อมกันได้ ${cap} คัน ประกาศนี้บันทึกไว้แล้ว ไปที่บัญชีของฉันเพื่อปิดประกาศเก่าหรืออัปเกรดเป็น VIP` : aErr.message);
      }
      location.assign(`/r/${row.short_id}`);
    } catch (x) {
      setErr(x instanceof Error ? x.message : "บันทึกไม่สำเร็จ");
      setBusy(null);
    }
  }

  const row2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 } as const;
  const lab = { display: "grid", gap: 4, fontSize: 14 } as const;

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 18, maxWidth: 820 }}>
      <fieldset className="box" disabled={!!busy}>
        <h2>ข้อมูลรถ</h2>
        <div style={{ display: "flex", gap: 16 }}>
          {([["used", "รถมือสอง"], ["new", "รถใหม่ป้ายแดง"]] as const).map(([v, t]) => (
            <label key={v} style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="radio" name="cond" checked={cond === v} onChange={() => setCond(v)} /> {t}</label>
          ))}
        </div>
        <div style={row2}>
          <label style={lab}>ยี่ห้อ<input name="brand" className="field" list="brands" required maxLength={40} placeholder="เช่น Toyota" /></label>
          <label style={lab}>รุ่น<input name="model" className="field" required maxLength={60} placeholder="เช่น Commuter" /></label>
          <label style={lab}>รุ่นย่อย<input name="trim" className="field" maxLength={80} placeholder="เช่น 3.0 D4D หลังคาสูง" /></label>
          <label style={lab}>ปีรถ<input name="year" className="field" type="number" required min={1970} max={new Date().getFullYear() + 1} defaultValue={2019} /></label>
          {cond === "used" && <label style={lab}>เลขไมล์ (กม.)<input name="km" className="field" type="number" required min={0} max={2000000} placeholder="เช่น 120000" /></label>}
          <label style={lab}>ประเภท<select name="body" className="field" defaultValue="van">{(Object.keys(BODY_TH) as BodyType[]).map((b) => <option key={b} value={b}>{BODY_TH[b]}</option>)}</select></label>
          <label style={lab}>เชื้อเพลิง<select name="fuel" className="field">{FUELS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label style={lab}>เกียร์<select name="gear" className="field">{GEARS.map((x) => <option key={x}>{x}</option>)}</select></label>
          <label style={lab}>สีรถ<input name="color" className="field" type="color" defaultValue="#d8dbe0" style={{ height: 42, padding: 4 }} /></label>
          <label style={lab}>จังหวัดที่รถอยู่<select name="province" className="field" defaultValue={province}>{Object.entries(PROVINCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label style={lab}>ราคา (บาท)<input name="price" className="field num" type="number" required min={10000} max={100000000} step={1000} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="เช่น 650000" /></label>
        </div>
        {priceN > 0 && <p className="note">แสดงเป็น ฿{baht(priceN)}</p>}
        <datalist id="brands">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist>
      </fieldset>

      <fieldset className="box" disabled={!!busy}>
        <h2>รูปรถ ({photos.length}/{MAX_PHOTOS})</h2>
        <p className="note">รูปแรกคือรูปปก แนะนำ: ด้านหน้าเฉียง ด้านข้าง ด้านหลัง ภายใน เบาะ ห้องเครื่อง เลขไมล์ ระบบจะย่อรูปให้อัตโนมัติ</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {photos.map((p, i) => (
            <div key={p.url} style={{ position: "relative", border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
              <img src={p.url} alt={`รูปที่ ${i + 1}`} style={{ aspectRatio: "4/3", objectFit: "cover", width: "100%" }} />
              {i === 0 && <span className="promo" style={{ position: "absolute", left: 6, top: 6 }}>ปก</span>}
              <div style={{ display: "flex", justifyContent: "space-between", padding: 4 }}>
                <button type="button" className="field" style={{ width: "auto", padding: "2px 8px" }} onClick={() => move(i, -1)} aria-label="เลื่อนไปก่อนหน้า">←</button>
                <button type="button" className="field" style={{ width: "auto", padding: "2px 8px" }} onClick={() => remove(i)} aria-label="ลบรูป">ลบ</button>
                <button type="button" className="field" style={{ width: "auto", padding: "2px 8px" }} onClick={() => move(i, 1)} aria-label="เลื่อนไปถัดไป">→</button>
              </div>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="field" style={{ aspectRatio: "4/3", display: "grid", placeItems: "center", cursor: "pointer", textAlign: "center" }}>
              + เพิ่มรูป
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </fieldset>

      <fieldset className="box" disabled={!!busy}>
        <h2>การชำระเงิน</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 6 }}><input type="radio" name="paymode" checked={payMode === "cash"} onChange={() => setPayMode("cash")} /> ขายสดเท่านั้น</label>
          <label style={{ display: "flex", gap: 6 }}><input type="radio" name="paymode" checked={payMode === "fin"} onChange={() => setPayMode("fin")} /> รับผ่อนได้</label>
        </div>
        {payMode === "fin" && (
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <label style={{ display: "flex", gap: 6 }}><input type="checkbox" name="pay_finance" defaultChecked /> ผ่อนผ่านไฟแนนซ์</label>
              <label style={{ display: "flex", gap: 6 }}><input type="checkbox" name="pay_inhouse" /> ผ่อนกับร้านเอง (ไม่ผ่านไฟแนนซ์)</label>
              <label style={{ display: "flex", gap: 6 }}><input type="checkbox" checked={freeDown} onChange={(e) => setFreeDown(e.target.checked)} /> ฟรีดาวน์</label>
            </div>
            <div style={row2}>
              {!freeDown && <label style={lab}>เงินดาวน์ (บาท)<input name="down" className="field" type="number" min={0} step={1000} placeholder="ไม่บังคับ" /></label>}
              <label style={lab}>ค่างวดต่อเดือน (บาท)<input name="monthly" className="field" type="number" min={0} step={100} placeholder="ไม่บังคับ" /></label>
              <label style={lab}>จำนวนงวด<select name="months" className="field" defaultValue=""><option value="">ไม่ระบุ</option>{[24, 36, 48, 60, 72, 84].map((m) => <option key={m}>{m}</option>)}</select></label>
              <label style={lab}>ดอกเบี้ย (% ต่อปี)<input name="rate" className="field" type="number" min={0} max={30} step={0.01} placeholder="ไม่บังคับ" /></label>
            </div>
            <p className="note">ถ้าไม่ใส่ค่างวด เว็บจะคำนวณค่างวดประมาณให้ผู้ซื้อดูเอง</p>
          </>
        )}
      </fieldset>

      <fieldset className="box" disabled={!!busy}>
        <h2>ช่องทางติดต่อ</h2>
        <div style={row2}>
          <label style={lab}>เบอร์โทร<input name="phone" className="field" type="tel" inputMode="tel" maxLength={20} placeholder="08x-xxx-xxxx" /></label>
          <label style={lab}>LINE ID<input name="line" className="field" maxLength={40} placeholder="ไม่บังคับ" /></label>
        </div>
        <p className="note">เบอร์และ LINE จะไม่อยู่บนหน้าประกาศ จะแสดงเมื่อผู้ซื้อกดดูเท่านั้น ประกาศแสดง 60 วัน ต่ออายุฟรีในหน้าบัญชีของฉัน แพ็กเกจปัจจุบัน: {plan === "free" ? "ฟรี (ลงพร้อมกันได้ 5 คัน)" : plan.toUpperCase()}</p>
        <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
          <input type="checkbox" required style={{ marginTop: 4 }} />
          <span className="note">ยืนยันว่าเป็นเจ้าของรถหรือได้รับอนุญาตให้ขาย และข้อมูลเป็นความจริง</span>
        </label>
      </fieldset>

      {err && <p role="alert" style={{ color: "var(--warn)", margin: 0, fontWeight: 600 }}>{err}</p>}
      <button className="primary" disabled={!!busy} style={{ justifySelf: "start", padding: "12px 22px" }}>{busy ?? "ลงประกาศ"}</button>
    </form>
  );
}
