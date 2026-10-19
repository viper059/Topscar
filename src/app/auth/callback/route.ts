import { NextResponse, type NextRequest } from "next/server";
import { safeNext, userDb } from "@/lib/server";

/** Magic-link and Google sign-in land here with ?code=…; exchange it for a session cookie. */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const next = safeNext(url.searchParams.get("next"));
  const code = url.searchParams.get("code");
  const db = await userDb();
  if (code && db) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
  }
  return NextResponse.redirect(new URL(`/login?error=1&next=${encodeURIComponent(next)}`, url.origin));
}
