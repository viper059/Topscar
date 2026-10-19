import "server-only";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Service-role client: bypasses RLS. Use only in route handlers for rate-limited or admin work. */
export function serviceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Supabase client acting as the signed-in member (RLS applies). Null when Supabase is not configured. */
export async function userDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const jar = await cookies();
  return createServerClient(url, anon, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => {
        // Server Components can't set cookies; the middleware refreshes the session instead.
        try { list.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch {}
      },
    },
  });
}

/** The signed-in member (null for guests). */
export async function currentUser() {
  const db = await userDb();
  if (!db) return null;
  const { data } = await db.auth.getUser();
  return data.user ?? null;
}

export type Profile = {
  id: string; display_name: string; seller_type: "private" | "tent" | "dealer"; shop_name: string | null;
  province: string | null; verified: boolean; plan: "free" | "vip" | "pro"; credits: number;
};

export async function currentProfile(): Promise<{ user: NonNullable<Awaited<ReturnType<typeof currentUser>>>; profile: Profile | null } | null> {
  const db = await userDb();
  if (!db) return null;
  const { data } = await db.auth.getUser();
  if (!data.user) return null;
  const { data: profile } = await db.from("profiles").select("id,display_name,seller_type,shop_name,province,verified,plan,credits").eq("id", data.user.id).maybeSingle();
  return { user: data.user, profile: (profile as Profile) ?? null };
}

export async function sha256(text: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Bangkok calendar day, so the guest limit resets at local midnight. */
export const bangkokDay = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);

/** Only allow same-site relative redirects after login. */
export const safeNext = (next: string | null | undefined, fallback = "/account") =>
  next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
