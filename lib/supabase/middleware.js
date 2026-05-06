import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Refreshes the user's session on every request so server components always
// see up-to-date auth state. Also enforces the brand dashboard route guard.
export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANT: do not put logic between createServerClient and getUser().
  // A simple mistake could make it very hard to debug issues with users
  // being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/dashboard");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  // Helper: redirect while preserving any Supabase cookies the SSR client
  // queued on `supabaseResponse` (e.g. refreshed access/refresh tokens).
  const redirectPreservingCookies = (url) => {
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirect.cookies.set(cookie);
    });
    return redirect;
  };

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return redirectPreservingCookies(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    // Hand off to the dashboard router which picks brand vs creator based on
    // which profile row exists for this user.
    url.pathname = "/dashboard";
    url.search = "";
    return redirectPreservingCookies(url);
  }

  // Suppress unused warning; isAuthRoute kept for future use.
  void isAuthRoute;

  return supabaseResponse;
}
