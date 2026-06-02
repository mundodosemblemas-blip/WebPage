// Persistence layer backed by Supabase. The function signatures mirror the
// original localStorage prototype, except they are now async (they hit the
// network) — callers must await them. Run supabase/schema.sql once to create
// the table and policies these functions expect.

import { normalizeCVPhone } from "./phone";
import { supabase } from "./supabase";

// An order line stores the product id plus a snapshot of the name and unit
// price at the time of ordering, so the order stays accurate even if the
// product is later edited, hidden, or removed from the catalog.
export interface OrderItem {
  pinId: string; // product id
  name?: string; // snapshot of product name
  price?: number; // snapshot of unit price (CVE)
  qty: number;
}

export interface Order {
  code: string; // human-friendly order code, e.g. MDE-7F3A
  name?: string; // optional person/club label
  club?: string; // optional club label
  email: string;
  phone: string;
  items: OrderItem[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const TABLE = "orders";

// Shape of a row as stored in / returned from Supabase.
interface OrderRow {
  code: string;
  name: string | null;
  club: string | null;
  email: string;
  phone: string;
  email_key: string;
  phone_key: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function normPhone(s: string): string {
  return normalizeCVPhone(s);
}

function genCode(): string {
  const part = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MDE-${part}`;
}

function rowToOrder(row: OrderRow): Order {
  return {
    code: row.code,
    name: row.name ?? undefined,
    club: row.club ?? undefined,
    email: row.email,
    phone: row.phone,
    items: row.items ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createOrder(
  data: Omit<Order, "code" | "createdAt" | "updatedAt">
): Promise<Order> {
  const base = {
    name: data.name ?? null,
    club: data.club ?? null,
    email: data.email,
    phone: data.phone,
    email_key: norm(data.email),
    phone_key: normPhone(data.phone),
    items: data.items,
  };

  // Generate a code and insert; retry on the rare unique-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row, error } = await supabase
      .from(TABLE)
      .insert({ ...base, code: genCode() })
      .select()
      .single();

    if (!error && row) return rowToOrder(row as OrderRow);
    // 23505 = unique_violation (code already taken) -> try a new code.
    if (error && error.code === "23505") continue;
    if (error) throw error;
  }
  throw new Error("Could not generate a unique order code. Please try again.");
}

export async function updateOrder(
  code: string,
  patch: Partial<Pick<Order, "items" | "name" | "club" | "email" | "phone">>
): Promise<Order | null> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.items !== undefined) update.items = patch.items;
  if (patch.name !== undefined) update.name = patch.name ?? null;
  if (patch.club !== undefined) update.club = patch.club ?? null;
  if (patch.email !== undefined) {
    update.email = patch.email;
    update.email_key = norm(patch.email);
  }
  if (patch.phone !== undefined) {
    update.phone = patch.phone;
    update.phone_key = normPhone(patch.phone);
  }

  const { data: row, error } = await supabase
    .from(TABLE)
    .update(update)
    .eq("code", code)
    .select()
    .maybeSingle();

  if (error) throw error;
  return row ? rowToOrder(row as OrderRow) : null;
}

// Look up orders by email OR phone — either identifier is enough to find an
// order. At least one of the two must be non-empty.
export async function findOrders(
  email: string,
  phone: string
): Promise<Order[]> {
  const e = norm(email);
  const p = normPhone(phone);
  const hasEmail = e.length > 0;
  const hasPhone = p.length > 0;
  if (!hasEmail && !hasPhone) return [];

  let query = supabase.from(TABLE).select();
  if (hasEmail && hasPhone) {
    query = query.or(`email_key.eq.${e},phone_key.eq.${p}`);
  } else if (hasEmail) {
    query = query.eq("email_key", e);
  } else {
    query = query.eq("phone_key", p);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(rowToOrder);
}

export async function findByCode(code: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select()
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data ? rowToOrder(data as OrderRow) : null;
}

export function orderTotal(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, it) => sum + (it.price ?? 0) * it.qty, 0);
}

// Admin: every order, newest first.
export async function listAllOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select()
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(rowToOrder);
}

export async function deleteOrder(code: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("code", code);
  if (error) throw error;
}

export function orderCount(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, it) => sum + it.qty, 0);
}
