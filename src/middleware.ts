import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "";
const CANONICAL_HOST = SITE ? new URL(SITE).host : "";
const MEMBER_PATHS = /^\/(account|sell|admin|login|api)(\/|$)/;

export async function middleware(req: NextRequest) {
  // 1) One address for Google and for sharing: send *.workers.dev and www. to the main domain (301).
  const host = req.headers.get("host") || "";
  if (CANONICAL_HOST && host !== CANONICAL_HOST && (host.endsWith(".workers.dev") || host === `www.${CANONICAL_HOST}`)) {
    const to = new URL(req.nextUrl.pathname + req.nextUrl.search, SITE);
    return NextResponse.redirect(to, 301);
  }

  // 2) Keep the Supabase login session fresh on member pages only. Public pages skip this, so they stay fast.
  if (!MEMBER_PATHS.test(req.nextUrl.pathname)) return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let res = NextResponse.next({ request: req });
  if (!url || !anon) return res;
  const db = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => req.cookies.set(name, value));
        res = NextResponse.next({ request: req });
        list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      },
    },
  });
  await db.auth.getUser();
  return res;
}

// Every page (for the domain redirect), but not Next.js build files or images.
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
