import "server-only";
import { currentUser, serviceDb } from "./server";

/** The signed-in admin, or null. Admin emails live in the `admins` table (never in code). */
export async function currentAdmin() {
  const db = serviceDb();
  const user = await currentUser();
  if (!db || !user?.email) return null;
  const { data } = await db.from("admins").select("email").eq("email", user.email.toLowerCase()).maybeSingle();
  return data ? { user, db } : null;
}
