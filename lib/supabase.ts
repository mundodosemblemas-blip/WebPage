// Supabase browser client. Reads the public project URL and anon key from
// NEXT_PUBLIC_* env vars (safe to expose — row access is guarded by RLS).
// Copy .env.local.example to .env.local and fill these in.
//
// The client is created lazily so a missing/placeholder config fails at the
// moment an order operation runs (with a clear message) rather than crashing
// the whole bundle at build/prerender time.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local (see .env.local.example)."
    );
  }

  client = createClient(url, anonKey);
  return client;
}

// Proxy that defers client creation until the first property access (e.g.
// `supabase.from(...)`). Callers use it exactly like a SupabaseClient.
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const real = getClient();
    const value = Reflect.get(real, prop, real);
    // Bind methods to the real client so `this` is correct when called as
    // `supabase.from(...)` (otherwise `this` would be the proxy).
    return typeof value === "function" ? value.bind(real) : value;
  },
});
