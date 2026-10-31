# Tops Car (topscar.info)

ตลาดรถใหม่ป้ายแดงและรถมือสอง ทำด้วย Next.js 16 + Supabase + Cloudflare Workers

ถ้ายังไม่ได้ใส่คีย์ Supabase เว็บจะรันด้วยรถตัวอย่าง 16 คัน (`src/lib/seed.ts`) จึงลองเว็บได้ทันที

## รันในเครื่อง

```bash
npm install
cp .env.example .env.local   # ปล่อยค่า Supabase ว่างไว้ก่อนได้
npm run dev                  # เปิด http://localhost:3000
```

## โครงลิงก์ (SEO)

ใช้ slug ภาษาอังกฤษ เพราะลิงก์ภาษาไทยเวลาแชร์ใน LINE/Facebook จะกลายเป็น `%E0%B8...` ยาวมาก ส่วนชื่อหน้า (title) และเนื้อหาเป็นภาษาไทยทั้งหมด

| ลิงก์ | หน้า |
|---|---|
| `/used-cars` , `/new-cars` | รถมือสอง / รถใหม่ทั้งหมด |
| `/used-cars/in/ayutthaya` | รถมือสองตามจังหวัด |
| `/used-cars/type/van` , `/used-cars/type/van/ayutthaya` | ตามประเภทรถ (+จังหวัด) |
| `/used-cars/toyota` → `/toyota/commuter` → `/toyota/commuter/ayutthaya` | ตามยี่ห้อ รุ่น จังหวัด |
| `/used-cars/toyota/commuter/ayutthaya/2018-j6b5n7` | หน้ารถ 1 คัน |
| `/r/j6b5n7` | ลิงก์สั้นไว้แชร์ (redirect 301 ไปลิงก์เต็ม) |
| `/search?q=...` | ค้นหาด้วยภาษาพูด (noindex) |

ทุกหน้ามี title, description, canonical, Open Graph, JSON-LD (Car + Offer + BreadcrumbList หรือ ItemList) และลิงก์ภายในไปหน้ารวมที่เกี่ยวข้อง
- `/sitemap.xml` สร้างอัตโนมัติจากรถทุกคันและทุกหน้ารวมที่มีรถ
- `/robots.txt` กันหน้า search, api, account, sell, login
- หน้ารวมที่ยังไม่มีรถจะตั้งเป็น noindex เพื่อกันหน้าบาง
- ลิงก์ยี่ห้อหรือรุ่นที่ไม่มีอยู่จริงจะตอบ 404
- ลิงก์รถที่ยี่ห้อ รุ่น หรือจังหวัดไม่ตรง จะ redirect 308 ไปลิงก์ที่ถูก
- รถที่ขายแล้วยังเก็บหน้าไว้ ขึ้นป้าย "ขายแล้ว" พร้อมรถคล้ายกัน และ JSON-LD เป็น SoldOut

## เบอร์ผู้ขาย

เบอร์และ LINE ID **ไม่อยู่ใน HTML** ของหน้ารถ จะดึงผ่าน `POST /api/reveal` ตอนคนกดดูเท่านั้น
- สมาชิกดูได้ไม่จำกัด
- คนที่ไม่ได้ล็อกอินดูได้ `GUEST_REVEAL_LIMIT` คันต่อวัน (ค่าเริ่มต้น 15) นับจาก IP ที่ hash แล้วในตาราง `contact_reveals` และเริ่มนับใหม่ตอนเที่ยงคืนเวลาไทย

## ตั้งค่าใช้งานจริง (ชุดฟรี)

1. **โดเมน:** topscar.info (ซื้อที่ GoDaddy, nameserver ชี้มา Cloudflare แล้ว) ผูกกับ Worker ผ่าน `routes` ใน `wrangler.jsonc` ส่วน www และ *.workers.dev จะ redirect 301 มาที่ topscar.info
2. **Supabase:** โปรเจกต์ Topscar `vawowlwebzpmffgenenl` (https://vawowlwebzpmffgenenl.supabase.co) **ติดตั้งแล้ว 2026-10-19**: รัน `0001_init.sql` และ `0002_harden.sql` แล้ว Security Advisor ไม่มี error ส่วน publishable key ใส่ไว้ใน `.env.example` และ `wrangler.jsonc` แล้ว (คีย์นี้เปิดเผยได้) ถ้าจะสร้างฐานข้อมูลใหม่ ให้รันไฟล์ใน `supabase/migrations/` ตามลำดับ
3. **รูป:** ตอนนี้อยู่ใน Supabase Storage ถ้าย้ายไป R2 ทีหลัง ใช้โดเมน `img.topscar.info`
4. **คีย์:** แก้ `wrangler.jsonc` → `vars` แล้วตั้ง secret
   ```bash
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npx wrangler secret put REVEAL_SALT
   ```
   ใส่ `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ใน `.env.local` ก่อน build (ค่า `NEXT_PUBLIC_*` ถูกฝังตอน build)
5. **Deploy:** push ขึ้น GitHub branch main แล้ว Cloudflare Workers Builds จะ build และ deploy ให้อัตโนมัติ
6. **Google:** เพิ่มเว็บใน Search Console → ส่ง `https://topscar.info/sitemap.xml`
7. **กันโปรเจกต์ Supabase ฟรีหลับ:** แผนฟรีพักโปรเจกต์ถ้าไม่มีการใช้งาน 1 สัปดาห์ เว็บที่มีคนเข้าทุกวันจะไม่โดน ถ้าช่วงแรกคนยังน้อย ให้ตั้ง Cloudflare Cron เรียก `/sitemap.xml` วันละครั้ง

## ไฟล์หลัก

```
src/lib/seo.ts        ลิงก์ title description JSON-LD และการหาหน้ารวม
src/lib/search.ts     ค้นหาด้วยภาษาพูด (งบ ดาวน์ ผ่อน จังหวัด ใกล้ ประเภท ยี่ห้อ ปี)
src/lib/money.ts      ค่างวดแบบ flat rate + VAT 7% และป้ายราคาเทียบตลาด
src/lib/data.ts       อ่านข้อมูลจาก Supabase (หรือรถตัวอย่างถ้ายังไม่ตั้งค่า)
src/app/[cond]/[[...rest]]/page.tsx   หน้ารวมทุกแบบ + หน้ารถ
src/app/api/reveal/route.ts           ดูเบอร์ผู้ขาย + จำกัดจำนวน
supabase/migrations/0001_init.sql     ตาราง สิทธิ์ (RLS) และ view สำหรับหน้าเว็บ
```

## ระบบสมาชิกและลงประกาศ (ทำแล้ว)

- `/login` เข้าด้วยอีเมล ไม่ต้องตั้งรหัสผ่าน ได้ทั้งลิงก์และรหัสในอีเมล ปุ่ม Google จะโผล่เมื่อตั้ง `NEXT_PUBLIC_AUTH_GOOGLE=1`
- `/account` ครั้งแรกให้ตั้งค่าบัญชี (ชื่อ ประเภทคนขาย จังหวัด ยอมรับ PDPA) จากนั้นเป็นหน้าประกาศของฉัน: ดูสถิติ ขายแล้ว ต่ออายุ เปิดขายอีกครั้ง ลบ
- `/sell` ลงประกาศพร้อมรูปสูงสุด 15 รูป (ย่อเป็น WebP ในเครื่องก่อนอัป) เงื่อนไขผ่อน เบอร์ และ LINE
- รูปเก็บใน Supabase Storage bucket `listing-photos` ไว้ก่อน พอคนเข้าเยอะค่อยย้ายไป R2 แล้วแก้ `NEXT_PUBLIC_IMG_URL`
- กฎในฐานข้อมูล: แพ็กเกจฟรีเปิดขายพร้อมกันได้ 1 คัน VIP 15 คัน (แก้ล่าสุดใน `0008_plan_caps.sql` และ `src/lib/plans.ts`), ร่างค้างได้ไม่เกิน 10, เปิดขายใหม่ต่ออายุ 60 วันให้อัตโนมัติ, คนขายติ๊กว่า "ตรวจแล้ว" หรือแก้แพ็กเกจเองไม่ได้
- ยอดคนดูบันทึกผ่าน `/api/event` (นับ 1 ครั้งต่อเครื่องต่อวัน ไม่นับบอท) ต้องตั้ง `SUPABASE_SERVICE_ROLE_KEY` ก่อน

### ต้องตั้งค่าใน Supabase ก่อนเปิดจริง
1. **Authentication → URL Configuration:** ตั้ง Site URL เป็นโดเมนจริง แล้วเพิ่ม `https://โดเมน/auth/callback` ใน Redirect URLs
2. **อีเมล:** อีเมลที่ Supabase ส่งเองถูกจำกัดไว้แค่ไม่กี่ฉบับต่อชั่วโมง ใช้ทดสอบได้ แต่ก่อนเปิดจริงให้ต่อ SMTP ของตัวเอง (เช่น Resend มีแผนฟรี) ใน Authentication → SMTP
3. **ใส่รหัสในอีเมล (ถ้าต้องการ):** Authentication → Email Templates → Magic Link เพิ่ม `{{ .Token }}` ลงในอีเมล คนที่เปิดอีเมลคนละเครื่องจะพิมพ์รหัสแทนกดลิงก์ได้

## แอดมิน (`/admin`)

- เข้าได้เฉพาะอีเมลที่อยู่ในตาราง `admins` เท่านั้น (เก็บในฐานข้อมูล ไม่ใส่ในโค้ด เพราะ repo เป็น public) คนอื่นที่เปิดหน้านี้จะเจอหน้า 404
- ทำได้: ปิดรายงานประกาศ, ซ่อนประกาศ, ติดป้าย "ตรวจแล้ว", ใส่ราคากลาง, ยืนยันตัวตนคนขาย, เปิด VIP/Pro 30 วัน
- ต้องตั้ง secret `SUPABASE_SERVICE_ROLE_KEY` ใน Cloudflare ก่อน หน้านี้ถึงจะใช้ได้
- เพิ่มหรือลบแอดมินใน Supabase SQL Editor:
  ```sql
  insert into public.admins (email) values ('someone@example.com');
  delete from public.admins where email = 'someone@example.com';
  ```

## กฎหมาย (ทำแล้ว 2026-10-31)

- `/terms` ข้อตกลงการใช้งาน และ `/privacy` นโยบายความเป็นส่วนตัวตาม PDPA มาตรา 23 ชื่อผู้ดำเนินการตั้งที่ `NEXT_PUBLIC_OPERATOR_NAME` (ดู `src/lib/legal.ts`)
- `0007_activity_log.sql` เก็บข้อมูลจราจร (IP เวลา และใครลง แก้ หรือลบประกาศหรือเบอร์) 180 วันตาม พ.ร.บ.คอมพิวเตอร์ มาตรา 26 ส่วน log การเข้าสู่ระบบ Supabase เก็บไว้ใน `auth.audit_log_entries`
- เครื่องคำนวณค่างวดแสดงดอกเบี้ยแท้จริง และเตือนเมื่อเกินเพดาน สคบ. (รถใหม่ 10% รถมือสอง 15%)
- หน้า VIP ติดป้าย "เร็วๆ นี้" กับฟีเจอร์ที่ยังไม่ได้ทำ

## ยังไม่ได้ทำ (ขั้นต่อไป)

- LINE Login (ต่อแบบ custom OIDC) และเบอร์โทร OTP (ต้องมีผู้ให้บริการ SMS ซึ่งเสียเงิน)
- โปรโมท/VIP + จ่ายเงินพร้อมเพย์, ปุ่มบันทึกรถบนเว็บจริง
- หน้าแก้ไขประกาศ (ตอนนี้ลบแล้วลงใหม่)
- งานคำนวณ `market_price` ทุกคืน (งาน `expire_listings()` ตั้งใน pg_cron แล้ว)
- ภาพ Open Graph อัตโนมัติสำหรับรถที่ยังไม่มีรูป
- ตอนนี้หน้าเว็บสร้างใหม่ทุกครั้งที่มีคนเข้า พอคนเยอะขึ้นค่อยเปิด cache ของ OpenNext
