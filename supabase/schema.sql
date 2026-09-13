-- Mundo dos Emblemas — full database schema.
-- Run this once on a NEW Supabase project (Dashboard -> SQL Editor -> New query).
-- For an existing database created from an earlier version, run the files in
-- supabase/migrations/ instead — this file is the end state, not an upgrade.
--
-- Access model: the browser (anon role) may read active products and nothing
-- else. Every write, and every read of an order, goes through a Next.js route
-- handler using SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS and never leaves
-- the server.

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- ===========================================================================
-- ORDERS
-- ===========================================================================
create table if not exists public.orders (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,            -- human-friendly, e.g. MDE-7F3A
  name         text,                            -- optional person label
  club         text,                            -- optional club label
  email        text not null,                   -- as entered (for display)
  phone        text not null,                   -- as entered (for display)
  email_key    text not null,                   -- normalized lookup key (lowercased)
  phone_key    text not null,                   -- normalized lookup key (7-digit national)
  items        jsonb not null default '[]',     -- [{ pinId, name, price, qty }, ...]
  -- Lifecycle. 'pending' is the only status the customer can still edit in.
  status       text not null default 'pending'
                 check (status in ('pending', 'confirmed', 'cancelled')),
  confirmed_at timestamptz,                     -- set when the admin confirms
  -- Secret included in the confirmation email link, so an order can be opened
  -- directly without typing the email/phone again.
  edit_token   uuid not null default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Lookup by the contact details typed on the "find my order" screen.
create index if not exists orders_identity_idx on public.orders (email_key, phone_key);
-- Admin list: newest first, filtered by status.
create index if not exists orders_status_idx   on public.orders (status, created_at desc);

alter table public.orders enable row level security;
-- Deliberately no policies: the anon role can see nothing. Order reads and
-- writes happen server-side under the service-role key, which bypasses RLS.

-- ===========================================================================
-- PRODUCTS — the catalog shown in the storefront.
-- Managed from /admin so items can be added, edited or hidden without a deploy.
-- ===========================================================================
create table if not exists public.products (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  slug        text,                          -- URL segment for /produtos/<slug>
  description text,                          -- shown on the product detail page
  type        text not null default 'pin',   -- pin | emblema | cinto | insignia | outro
  price       integer not null default 0,    -- whole CVE (Cape Verdean escudo)
  image       text,                          -- path under /public or full URL
  active      boolean not null default true, -- hide from the storefront without deleting
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (active, sort_order);
create unique index if not exists products_slug_key
  on public.products (slug) where slug is not null;

-- Seed the original pins (text ids match items stored on existing orders).
insert into public.products (id, name, slug, type, price, image, sort_order) values
  ('p01', 'Passarinhos',     'passarinhos',     'pin', 230, '/passarinhos.jpg',           1),
  ('p02', 'Ovelhinha',       'ovelhinha',       'pin', 230, '/ovelhinha.jpg',             2),
  ('p03', 'Edificadores',    'edificadores',    'pin', 230, '/edificadores.png',          3),
  ('p04', 'Luminares',       'luminares',       'pin', 230, '/luminares.png',             4),
  ('p05', 'Mãos ajudadoras', 'maos-ajudadoras', 'pin', 230, '/maos-ajudadoras.png',       5),
  ('p06', 'Abelhinhas',      'abelhinhas',      'pin', 230, '/abelhinhas-laboriosas.png', 6)
on conflict (id) do nothing;

alter table public.products enable row level security;

-- The catalog is public, but only the products actually on sale. Writes are
-- admin-only and go through a server route under the service-role key.
drop policy if exists "anon can read active products" on public.products;
create policy "anon can read active products"
  on public.products for select to anon
  using (active = true);
