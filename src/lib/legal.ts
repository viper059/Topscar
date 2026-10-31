import { BRAND } from "./seo";

// Who runs the site (the "data controller" under PDPA section 23).
// Set NEXT_PUBLIC_OPERATOR_NAME in wrangler.jsonc vars / .env.production to the owner's name or company.
export const OPERATOR = process.env.NEXT_PUBLIC_OPERATOR_NAME || `ผู้ดูแลเว็บไซต์ ${BRAND}`;
export const CONTACT_PHONE = "063-313-9183";
export const CONTACT_TEL = "tel:0633139183";
export const LEGAL_UPDATED = "31 ตุลาคม 2569";
export const LOG_DAYS = 180; // keep in sync with supabase/migrations/0007_activity_log.sql
