"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./env";

/**
 * Browser Supabase client (Client Components). Typed against the generated
 * `Database` schema. Created lazily so importing this module never throws
 * when env vars are absent (mock-data mode).
 */
export function createClient() {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
