// Shared domain types and pure helpers. This module has no server-only imports
// (no Supabase, no nodemailer), so client components can import it freely.
// The database access layers live in lib/db/ and are server-only.

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export type ProductType = "pin" | "emblema" | "cinto" | "insignia" | "outro";

// A club the items are made for. Managed from /admin.
export interface Club {
  id: string;
  name: string;
  slug: string | null;
  active: boolean;
  sortOrder: number;
}

// PUBLIC product shape. This is what gets serialised into the page and sent to
// the browser, so it deliberately carries no supplier cost and no packing
// weight — see AdminProduct below.
export interface Product {
  id: string;
  name: string;
  slug: string | null; // URL segment; falls back to id when absent
  description: string | null;
  type: ProductType;
  price: number; // sale price, whole CVE
  image: string | null;
  size: string | null; // e.g. "25 mm"
  finish: string | null; // enamel / plating, e.g. "Soft enamel, gold"
  clubId: string | null;
  clubName: string | null; // denormalised for display
  clubSlug: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

// ADMIN product shape: everything public plus the commercially sensitive
// fields. Only ever returned by the admin API routes, which are behind the
// session cookie. Never pass one of these to a public page.
export interface AdminProduct extends Product {
  costUsd50: number | null; // supplier unit cost at 50 pcs, USD
  costUsd100: number | null; // supplier unit cost at 100 pcs, USD
  pkgWeightG: number | null; // packed weight, grams
}

// Stored type values have not always been consistent ("Insignia", "insígnia"),
// and a mismatched value makes a product unreachable by its own category
// filter. Everything read from the database goes through here, so casing and
// accents can never break filtering again.
export function normalizeProductType(raw: unknown): ProductType {
  const key = String(raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return PRODUCT_TYPES.some((t) => t.value === key)
    ? (key as ProductType)
    : "outro";
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

// Material 3 container tokens used for the category badge in the storefront.
export const PRODUCT_TYPE_BADGE: Record<string, string> = {
  pin: "bg-secondary-container text-on-secondary-container",
  emblema: "bg-tertiary-container text-on-tertiary",
  cinto: "bg-primary-container text-on-primary-container",
  insignia: "bg-secondary-container text-on-secondary-container",
  outro: "bg-surface-container-high text-on-surface",
};

// The URL segment for a product. Older rows may have no slug, so the id is the
// fallback — /produtos/[slug] accepts either.
export function productHref(p: Pick<Product, "id" | "slug">): string {
  return `/produtos/${p.slug || p.id}`;
}

// "Mãos ajudadoras" -> "maos-ajudadoras". Accents are stripped via NFD so the
// slug stays URL-safe without pulling in a dependency.
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function productMap(list: Product[]): Record<string, Product> {
  return Object.fromEntries(list.map((p) => [p.id, p]));
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

// An order line stores the product id plus a snapshot of the name and unit
// price at the time of ordering, so the order stays accurate even if the
// product is later edited, hidden, or removed from the catalog.
export interface OrderItem {
  pinId: string; // product id
  name?: string; // snapshot of product name
  price?: number; // snapshot of unit price (CVE)
  qty: number;
}

// 'pending'   — the customer can still change it themselves
// 'confirmed' — the admin approved it; the customer view becomes read-only
// 'cancelled' — closed without being fulfilled
export type OrderStatus = "pending" | "confirmed" | "cancelled";

export interface Order {
  code: string; // human-friendly order code, e.g. MDE-7F3A
  name?: string; // optional person label
  club?: string; // optional club label
  email: string;
  phone: string;
  items: OrderItem[];
  status: OrderStatus;
  confirmedAt?: string; // ISO, set when the admin confirms
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmado" },
  { value: "cancelled", label: "Cancelado" },
];

export const ORDER_STATUS_LABEL: Record<string, string> = Object.fromEntries(
  ORDER_STATUSES.map((s) => [s.value, s.label])
);

export const ORDER_STATUS_BADGE: Record<string, string> = {
  pending: "bg-secondary-container text-on-secondary-container",
  confirmed: "bg-primary-container text-on-primary-container",
  cancelled: "bg-error-container text-on-error-container",
};

// The single rule behind the whole edit lock: a customer may change an order
// only while it is still pending. Enforced server-side in lib/db/orders.ts —
// the UI uses this only to decide what to render.
export function isCustomerEditable(order: Pick<Order, "status">): boolean {
  return order.status === "pending";
}

export function orderTotal(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, it) => sum + (it.price ?? 0) * it.qty, 0);
}

export function orderCount(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, it) => sum + it.qty, 0);
}

// ---------------------------------------------------------------------------
// Display helpers
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
