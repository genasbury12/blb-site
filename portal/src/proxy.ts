import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/routes";

/**
 * Refreshes the Supabase session cookie and keeps signed out visitors out of member and admin routes.
 * This is a convenience layer only. Pages, server actions, and Postgres RLS each authorize again.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const protectedPath = isProtectedPath(request.nextUrl.pathname);

  const toLogin = () => {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.search = "";
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  };

  if (!url || !key) return protectedPath ? toLogin() : NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });

  // getClaims verifies the JWT; it does not trust the cookie blindly.
  const { data } = await supabase.auth.getClaims();
  if (protectedPath && !data?.claims?.sub) return toLogin();
  if (protectedPath) response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
