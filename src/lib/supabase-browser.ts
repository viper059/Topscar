"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/** Supabase client for the browser, signed in as the current member (session in cookies). */
export function sb(): SupabaseClient {
  return (client ??= createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!));
}

export const PHOTO_BUCKET = "listing-photos";
