-- Mundo dos Emblemas — orders schema.
-- Run this once in the Supabase SQL editor (Dashboard -> SQL Editor -> New query).
-- It creates the orders table and the Row Level Security policies the public
-- (anon) client needs to create, look up, and edit orders.

create extension if not exists "pgcrypto"; -- for gen_random_uuid()

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,            -- human-friendly, e.g. MDE-7F3A
  name        text,                            -- optional person label
  club        text,                            -- optional club label
  email       text not null,                   -- as entered (for display)
  phone       text not null,                   -- as entered (for display)
  email_key   text not null,                   -- normalized lookup key (lowercased)
  phone_key   text not null,                   -- normalized lookup key (7-digit national)
  items       jsonb not null default '[]',     -- [{ "pinId": "p01", "qty": 2 }, ...]
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Fast lookup by the email+phone identity used on the "edit order" screen.
create index if not exists orders_identity_idx
  on public.orders (email_key, phone_key);

alter table public.orders enable row level security;

-- Prototype access model: this is a public ordering form with no login, so the
-- anon role is allowed to insert and to read/update rows. Lookups are scoped by
-- email+phone in the query. NOTE: anon can technically read/update any row if it
-- crafts its own request — acceptable for a low-stakes prototype, but move to
-- server-side API routes with a service key (and tighter policies) before this
-- holds anything sensitive.
drop policy if exists "anon can insert orders" on public.orders;
create policy "anon can insert orders"
  on public.orders for insert to anon
  with check (true);

drop policy if exists "anon can read orders" on public.orders;
create policy "anon can read orders"
  on public.orders for select to anon
  using (true);

drop policy if exists "anon can update orders" on public.orders;
create policy "anon can update orders"
  on public.orders for update to anon
  using (true) with check (true);

-- Admin (still the anon client in this prototype) can delete orders.
drop policy if exists "anon can delete orders" on public.orders;
create policy "anon can delete orders"
  on public.orders for delete to anon
  using (true);


-- =====================================================================
-- PRODUCTS — the catalog (pins, emblemas, cintos, insignias, ...).
-- Managed from the /admin screen so items can be added/edited/hidden
-- without code changes. The public order form reads active products.
-- =====================================================================
create table if not exists public.products (
  id          text primary key default gen_random_uuid()::text,
  name        text not null,
  type        text not null default 'pin',   -- pin | emblema | cinto | insignia | outro
  price       integer not null default 0,    -- whole CVE (Cape Verdean escudo)
  image       text,                          -- path under /public or full URL
  active      boolean not null default true, -- hide from the catalog without deleting
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists products_active_idx on public.products (active, sort_order);

-- Seed the original hardcoded pins (text ids match existing order items).
insert into public.products (id, name, type, price, image, sort_order) values
  ('p01', 'Passarinhos',     'pin', 230, '/passarinhos.jpg',            1),
  ('p02', 'Ovelhinha',       'pin', 230, '/ovelhinha.jpg',              2),
  ('p03', 'Edificadores',    'pin', 230, '/edificadores.png',           3),
  ('p04', 'Luminares',       'pin', 230, '/luminares.png',              4),
  ('p05', 'Mãos ajudadores', 'pin', 230, '/maos-ajudadoras.png',        5),
  ('p06', 'Abelinhas',       'pin', 230, '/abelhinhas-laboriosas.png',  6)
on conflict (id) do nothing;

alter table public.products enable row level security;

-- Prototype access model (same caveat as orders): the anon client can read all
-- products and the admin UI (gated by a password) can write them. Move writes to
-- a server route with a service key before this holds anything sensitive.
drop policy if exists "anon can read products" on public.products;
create policy "anon can read products"
  on public.products for select to anon
  using (true);

drop policy if exists "anon can insert products" on public.products;
create policy "anon can insert products"
  on public.products for insert to anon
  with check (true);

drop policy if exists "anon can update products" on public.products;
create policy "anon can update products"
  on public.products for update to anon
  using (true) with check (true);

drop policy if exists "anon can delete products" on public.products;
create policy "anon can delete products"
  on public.products for delete to anon
  using (true);
