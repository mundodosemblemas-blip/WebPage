import "server-only";

// Server-side product access under the service-role key.
//
// THE IMPORTANT RULE IN THIS FILE: there are two read paths.
//   listProducts / findProduct      -> PUBLIC_COLUMNS only, returns Product
//   listProductsAdmin / findAdmin   -> every column, returns AdminProduct
// The public path never selects cost_usd_50, cost_usd_100 or pkg_weight_g, so
// supplier costs cannot reach a page that is sent to the browser even by
// accident. Keep it that way when adding fields.

import { supabaseAdmin } from "../supabase-admin";
import {
  normalizeProductType,
  slugify,
  type AdminProduct,
  type Product,
  type ProductType,
} from "../types";

const TABLE = "products";

// Joined so the product page can show the club name without a second query.
const CLUB_JOIN = "clubs ( id, name, slug )";

const PUBLIC_COLUMNS =
  "id, name, slug, description, type, price, image, size, finish, club_id, active, sort_order, created_at, updated_at, " +
  CLUB_JOIN;

const ADMIN_COLUMNS = "*, " + CLUB_JOIN;

interface ClubJoin {
  id: string;
  name: string;
  slug: string | null;
}

interface ProductRow {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  type: string;
  price: number;
  image: string | null;
  size: string | null;
  finish: string | null;
  club_id: string | null;
  clubs: ClubJoin | ClubJoin[] | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

interface AdminProductRow extends ProductRow {
  cost_usd_50: number | string | null;
  cost_usd_100: number | string | null;
  pkg_weight_g: number | null;
}

// PostgREST returns an embedded row as an object, or an array depending on the
// relationship it infers; normalise both.
function firstClub(value: ProductRow["clubs"]): ClubJoin | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function rowToProduct(row: ProductRow): Product {
  const club = firstClub(row.clubs);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug ?? null,
    description: row.description ?? null,
    type: normalizeProductType(row.type),
    price: row.price ?? 0,
    image: row.image ?? null,
    size: row.size ?? null,
    finish: row.finish ?? null,
    clubId: row.club_id ?? null,
    clubName: club?.name ?? null,
    clubSlug: club?.slug ?? null,
    active: row.active,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// numeric(10,2) comes back from PostgREST as a string; keep it a number.
function toNumber(value: number | string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function rowToAdminProduct(row: AdminProductRow): AdminProduct {
  return {
    ...rowToProduct(row),
    costUsd50: toNumber(row.cost_usd_50),
    costUsd100: toNumber(row.cost_usd_100),
    pkgWeightG: row.pkg_weight_g ?? null,
  };
}

// ---------------------------------------------------------------------------
// Public reads — safe to pass to a page
// ---------------------------------------------------------------------------

export async function listProducts(
  opts: { activeOnly?: boolean; clubSlug?: string } = {}
): Promise<Product[]> {
  let query = supabaseAdmin()
    .from(TABLE)
    .select(PUBLIC_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (opts.activeOnly) query = query.eq("active", true);
  if (opts.clubSlug) query = query.eq("clubs.slug", opts.clubSlug);

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as ProductRow[]).map(rowToProduct);
}

// Detail pages are addressed by slug, but older rows may not have one, so the
// id is accepted as a fallback.
export async function findProduct(slugOrId: string): Promise<Product | null> {
  const key = slugOrId.trim();
  if (!key) return null;

  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(PUBLIC_COLUMNS)
    .or("slug.eq." + key + ",id.eq." + key)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProduct(data as unknown as ProductRow) : null;
}

// ---------------------------------------------------------------------------
// Admin reads — include supplier cost and packing weight. Callers must be
// behind the admin session check.
// ---------------------------------------------------------------------------

export async function listProductsAdmin(): Promise<AdminProduct[]> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select(ADMIN_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data as unknown as AdminProductRow[]).map(rowToAdminProduct);
}

// ---------------------------------------------------------------------------
// Writes — admin only
// ---------------------------------------------------------------------------

export type ProductInput = {
  name: string;
  slug?: string | null;
  description?: string | null;
  type: ProductType;
  price: number; // sale price, whole CVE
  image?: string | null;
  size?: string | null;
  finish?: string | null;
  clubId?: string | null;
  costUsd50?: number | null;
  costUsd100?: number | null;
  pkgWeightG?: number | null;
  active?: boolean;
  sortOrder?: number;
};

// Slugs must be unique. If the desired slug is taken, a numeric suffix is
// appended (-2, -3, ...) rather than failing the save.
async function uniqueSlug(desired: string, excludeId?: string): Promise<string> {
  const base = slugify(desired) || "produto";
  for (let n = 1; n < 50; n++) {
    const candidate = n === 1 ? base : base + "-" + n;
    const { data, error } = await supabaseAdmin()
      .from(TABLE)
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (error) throw error;
    const taken = data as { id: string } | null;
    if (!taken || taken.id === excludeId) return candidate;
  }
  return base + "-" + Date.now().toString(36);
}

export async function createProduct(data: ProductInput): Promise<AdminProduct> {
  const slug = await uniqueSlug(data.slug || data.name);
  const { data: row, error } = await supabaseAdmin()
    .from(TABLE)
    .insert({
      name: data.name,
      slug,
      description: data.description ?? null,
      type: data.type,
      price: data.price,
      image: data.image ?? null,
      size: data.size ?? null,
      finish: data.finish ?? null,
      club_id: data.clubId ?? null,
      cost_usd_50: data.costUsd50 ?? null,
      cost_usd_100: data.costUsd100 ?? null,
      pkg_weight_g: data.pkgWeightG ?? null,
      active: data.active ?? true,
      sort_order: data.sortOrder ?? 0,
    })
    .select(ADMIN_COLUMNS)
    .single();
  if (error) throw error;
  return rowToAdminProduct(row as unknown as AdminProductRow);
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>
): Promise<AdminProduct | null> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.description !== undefined) update.description = patch.description ?? null;
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.price !== undefined) update.price = patch.price;
  if (patch.image !== undefined) update.image = patch.image ?? null;
  if (patch.size !== undefined) update.size = patch.size ?? null;
  if (patch.finish !== undefined) update.finish = patch.finish ?? null;
  if (patch.clubId !== undefined) update.club_id = patch.clubId ?? null;
  if (patch.costUsd50 !== undefined) update.cost_usd_50 = patch.costUsd50 ?? null;
  if (patch.costUsd100 !== undefined) update.cost_usd_100 = patch.costUsd100 ?? null;
  if (patch.pkgWeightG !== undefined) update.pkg_weight_g = patch.pkgWeightG ?? null;
  if (patch.active !== undefined) update.active = patch.active;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;
  // A blank slug means "regenerate from the name".
  if (patch.slug !== undefined) {
    update.slug = await uniqueSlug(patch.slug || patch.name || "produto", id);
  }

  const { data: row, error } = await supabaseAdmin()
    .from(TABLE)
    .update(update)
    .eq("id", id)
    .select(ADMIN_COLUMNS)
    .maybeSingle();
  if (error) throw error;
  return row ? rowToAdminProduct(row as unknown as AdminProductRow) : null;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabaseAdmin().from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
