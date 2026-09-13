-- Migration 003 — richer product records and a managed club list.
--
-- Safe to run on the live database: everything here is additive and every new
-- column is nullable, so existing products and orders are untouched.
--
-- Adds to products:
--   club_id       -> which club the item is for (FK to the new clubs table)
--   size          -> e.g. "25 mm" (public)
--   finish        -> enamel / plating, e.g. "Soft enamel, gold" (public)
--   cost_usd_50   -> supplier unit cost at 50 pcs, USD  (ADMIN ONLY)
--   cost_usd_100  -> supplier unit cost at 100 pcs, USD (ADMIN ONLY)
--   pkg_weight_g  -> packed weight in grams            (ADMIN ONLY)
--
-- The three ADMIN ONLY columns are never selected by the public queries in
-- lib/db/products.ts, and RLS below does not expose them to the anon role
-- either. Sale price stays in whole CVE, in products.price.

-- ---------------------------------------------------------------------------
-- CLUBS — the managed list behind the "Clube" field
-- ---------------------------------------------------------------------------
create table if not exists public.clubs (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  slug        text,                          -- URL segment for filtering
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create unique index if not exists clubs_slug_key
  on public.clubs (slug) where slug is not null;
create index if not exists clubs_active_idx on public.clubs (active, sort_order);

alter table public.clubs enable row level security;

-- The club list is public (customers browse by club); writes are admin-only and
-- go through a server route under the service-role key.
drop policy if exists "anon can read active clubs" on public.clubs;
create policy "anon can read active clubs"
  on public.clubs for select to anon
  using (active = true);

-- ---------------------------------------------------------------------------
-- PRODUCTS — new columns
-- ---------------------------------------------------------------------------
alter table public.products
  -- Public, shown on the product page:
  add column if not exists club_id      text references public.clubs (id) on delete set null,
  add column if not exists size         text,
  add column if not exists finish       text,
  -- Admin only. Never selected by the public product queries.
  add column if not exists cost_usd_50  numeric(10, 2),
  add column if not exists cost_usd_100 numeric(10, 2),
  add column if not exists pkg_weight_g integer;

create index if not exists products_club_idx on public.products (club_id);

-- Guard against negative values slipping in from a mistyped admin form.
alter table public.products drop constraint if exists products_costs_non_negative;
alter table public.products add constraint products_costs_non_negative check (
  (cost_usd_50  is null or cost_usd_50  >= 0) and
  (cost_usd_100 is null or cost_usd_100 >= 0) and
  (pkg_weight_g is null or pkg_weight_g >= 0)
);

-- NOTE ON THE ANON POLICY
-- "anon can read active products" grants SELECT on the whole row, so the anon
-- key could in principle read the cost columns directly from Supabase even
-- though the app never sends them to the browser. Nothing in the app uses the
-- anon key for products any more (all reads go through the server), so the
-- policy is dropped here entirely. Re-add it only if you later want the browser
-- to query the catalog directly — and then do it through a view that exposes
-- the public columns only.
drop policy if exists "anon can read active products" on public.products;
