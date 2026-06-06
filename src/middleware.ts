import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Keeps the Supabase auth session fresh. Safe no-op until Supabase env vars
 * are configured (the UI still runs entirely on mock data in Phase 8).
 */
export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Run on app routes, excluding static assets and Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
