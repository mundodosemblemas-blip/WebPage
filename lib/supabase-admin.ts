import "server-only";

// Service-role Supabase client. This key bypasses Row Level Security, so it
// must NEVER reach the browser — the "server-only" import above makes the build
// fail if a client component ever pulls this module in.
//
// Get the key from the Supabase dashboard: Settings -> API -> service_role.
// Put it in .env as SUPABASE_SERVICE_ROLE_KEY (and in the Vercel project's
// environment variables for production).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

// Created lazily so a missing key surfaces as a clear runtime error on the
// route that needs it, rather than crashing the whole build/prerender.
export function supabaseAdmin(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing Supabase server config. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "SUPABASE_SERVICE_ROLE_KEY in .env (Supabase dashboard -> Settings -> API)."
    );
  }

  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
