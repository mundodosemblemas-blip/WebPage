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
