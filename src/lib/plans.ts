// Active listings a seller can have at once. Keep in sync with supabase/migrations/0008_plan_caps.sql.
export const PLAN_CAP = { free: 1, vip: 15, pro: null } as const;
export const PLAN_LABEL = {
  free: `สมาชิกฟรี (ลงพร้อมกันได้ ${PLAN_CAP.free} คัน)`,
  vip: `VIP เต็นท์ (${PLAN_CAP.vip} คัน)`,
  pro: "VIP Pro (ไม่จำกัด)",
} as const;
