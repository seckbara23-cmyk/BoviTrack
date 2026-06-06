/**
 * Centralised access to Supabase environment variables.
 *
 * Phase 8 is foundation-only: the UI still runs on mock data, so these may
 * be absent in local/dev. `isSupabaseConfigured` lets callers (e.g. the
 * middleware) safely no-op until the project is wired up in Phase 9+.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
