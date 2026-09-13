-- Migration 002 — close the old public database access.
--
-- Run this ONLY AFTER the new code is deployed. It removes the anon role's
-- access, which the new code does not need (it uses SUPABASE_SERVICE_ROLE_KEY
-- on the server) but the old code did. Running it too early takes the live site
-- down; running it after deploying is invisible to customers.
--
-- Why it matters: until now the anon key — which ships to every browser — could
-- read, edit and delete every row in both tables. That meant every customer's
-- email and phone number was publicly readable, and the customer edit lock
-- could be bypassed with a single crafted request. Idempotent: safe to re-run.

-- Orders: no policy at all. With RLS enabled and no policy, the anon role can
-- see nothing. The service-role key bypasses RLS, so the server is unaffected.
drop policy if exists "anon can insert orders" on public.orders;
drop policy if exists "anon can read orders"   on public.orders;
drop policy if exists "anon can update orders" on public.orders;
drop policy if exists "anon can delete orders" on public.orders;

-- Products: the catalog is public, but only the items actually on sale, and
-- read-only. Writes happen in the admin API routes under the service-role key.
drop policy if exists "anon can read products"   on public.products;
drop policy if exists "anon can insert products" on public.products;
drop policy if exists "anon can update products" on public.products;
drop policy if exists "anon can delete products" on public.products;

drop policy if exists "anon can read active products" on public.products;
create policy "anon can read active products"
  on public.products for select to anon
  using (active = true);

-- Confirm afterwards with:
--   select tablename, policyname, cmd from pg_policies
--   where schemaname = 'public' order by tablename;
-- Expect exactly one row: products / "anon can read active products" / SELECT.
