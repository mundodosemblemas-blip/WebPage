-- Migration 001 — storefront + order lifecycle (additive, safe to run first).
--
-- Run this BEFORE deploying the new code. Everything here only adds columns and
-- indexes, so the currently deployed site keeps working exactly as it does now.
-- Migration 002 then closes the old public access, and must be run only AFTER
-- the new code is live. Both are idempotent: re-running them is safe.
--
-- What it adds:
--   orders   -> status / confirmed_at / edit_token   (the customer edit lock)
--   products -> slug / description                   (storefront detail pages)
-- ---------------------------------------------------------------------------
-- ORDERS — lifecycle
-- ---------------------------------------------------------------------------

-- 'pending'   = the customer may still edit it themselves
-- 'confirmed' = locked; only the admin can change it now
-- 'cancelled' = locked; kept for the record
alter table public.orders
  add column if not exists status       text not null default 'pending',
  add column if not exists confirmed_at timestamptz,
  add column if not exists edit_token   uuid not null default gen_random_uuid();

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'confirmed', 'cancelled'));

-- The admin list is newest-first and filtered by status.
create index if not exists orders_status_idx on public.orders (status, created_at desc);

-- ---------------------------------------------------------------------------
-- PRODUCTS — storefront fields
-- ---------------------------------------------------------------------------

-- slug is the URL segment for /produtos/<slug>. Nullable so existing rows stay
-- valid; the app falls back to the product id when a slug is missing.
alter table public.products
  add column if not exists slug        text,
  add column if not exists description text;

create unique index if not exists products_slug_key
  on public.products (slug) where slug is not null;

-- Give the six seeded pins their slugs (no-op if they were renamed or removed).
update public.products set slug = 'passarinhos'       where id = 'p01' and slug is null;
update public.products set slug = 'ovelhinha'         where id = 'p02' and slug is null;
update public.products set slug = 'edificadores'      where id = 'p03' and slug is null;
update public.products set slug = 'luminares'         where id = 'p04' and slug is null;
update public.products set slug = 'maos-ajudadoras'   where id = 'p05' and slug is null;
update public.products set slug = 'abelhinhas'        where id = 'p06' and slug is null;
