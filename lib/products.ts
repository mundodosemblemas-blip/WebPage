// Catalog of products (pins, emblemas, cintos, insignias, ...) stored in
// Supabase so the admin can add/edit/hide them without code changes.
// Functions are async (network) — callers must await them.

import { supabase } from "./supabase";

export type ProductType = "pin" | "emblema" | "cinto" | "insignia" | "outro";

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number; // whole CVE
  image: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "pin", label: "Pin" },
  { value: "emblema", label: "Emblema" },
  { value: "cinto", label: "Cinto" },
  { value: "insignia", label: "Insígnia" },
  { value: "outro", label: "Outro" },
];

export const PRODUCT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  PRODUCT_TYPES.map((t) => [t.value, t.label])
);

// Material 3 container tokens used for the category badge in the catalog.
export const PRODUCT_TYPE_BADGE: Record<string, string> = {
  pin: "bg-secondary-container text-on-secondary-container",
  emblema: "bg-tertiary-container text-on-tertiary",
  cinto: "bg-primary-container text-on-primary-container",
  insignia: "bg-secondary-container text-on-secondary-container",
  outro: "bg-surface-container-high text-on-surface",
};

const TABLE = "products";

interface ProductRow {
  id: string;
  name: string;
  type: string;
  price: number;
  image: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    type: (row.type as ProductType) ?? "outro",
    price: row.price ?? 0,
    image: row.image ?? null,
    active: row.active,
    sortOrder: row.sort_order ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// List products. By default returns every product (for admin); pass
// { activeOnly: true } for the public catalog.
export async function listProducts(
  opts: { activeOnly?: boolean } = {}
): Promise<Product[]> {
  let query = supabase
    .from(TABLE)
    .select()
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (opts.activeOnly) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return (data as ProductRow[]).map(rowToProduct);
}

export type ProductInput = {
  name: string;
  type: ProductType;
  price: number;
  image?: string | null;
  active?: boolean;
  sortOrder?: number;
};

export async function createProduct(data: ProductInput): Promise<Product> {
  const { data: row, error } = await supabase
    .from(TABLE)
    .insert({
      name: data.name,
      type: data.type,
      price: data.price,
      image: data.image ?? null,
      active: data.active ?? true,
      sort_order: data.sortOrder ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToProduct(row as ProductRow);
}

export async function updateProduct(
  id: string,
  patch: Partial<ProductInput>
): Promise<Product | null> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.price !== undefined) update.price = patch.price;
  if (patch.image !== undefined) update.image = patch.image ?? null;
  if (patch.active !== undefined) update.active = patch.active;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;

  const { data: row, error } = await supabase
    .from(TABLE)
    .update(update)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return row ? rowToProduct(row as ProductRow) : null;
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

export function productMap(list: Product[]): Record<string, Product> {
  return Object.fromEntries(list.map((p) => [p.id, p]));
}

// ---------------------------------------------------------------------------
// Shared display helpers (used across catalog, summary and admin screens).
// ---------------------------------------------------------------------------

// Cape Verdean escudo (CVE). Whole escudos, "." thousands separator, e.g.
// "1.500 CVE".
export function formatCVE(value: number): string {
  return `${Math.round(value).toLocaleString("pt-PT")} CVE`;
}

// Generic placeholder shown when a product has no image (or it fails to load).
export const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#eeeef0"/>
  <circle cx="200" cy="180" r="110" fill="#c4c6cf"/>
  <circle cx="200" cy="180" r="110" fill="none" stroke="#74777f" stroke-width="3" stroke-dasharray="6 10"/>
  <rect x="175" y="290" width="50" height="64" rx="6" fill="#aeb0b6"/>
  <text x="200" y="188" font-family="Arial, sans-serif" font-size="28" font-weight="700"
        fill="#002D72" text-anchor="middle" dominant-baseline="middle">PIN</text>
</svg>`.trim()
)}`;
