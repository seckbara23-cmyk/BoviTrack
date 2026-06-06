import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY, isSupabaseConfigured } from "./env";

/**
 * Refreshes the Supabase auth session on each request and keeps the auth
 * cookies in sync. Auth foundation only — no route gating yet, so the app
 * keeps working on mock data. No-ops when Supabase is not configured.
 */
export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  if (!isSupabaseConfigured) {
    return response;
  }

  const supabase = createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh the session and read the current user.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route gating: unauthenticated users are sent to /login. Public paths
  // (the login screen and the logout handler) are always allowed.
  const path = request.nextUrl.pathname;
  const isPublic = path === "/login" || path === "/logout";

  if (!user && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Already signed in? Skip the login screen.
  if (user && path === "/login") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/dashboard";
    return NextResponse.redirect(homeUrl);
  }

  return response;
}
