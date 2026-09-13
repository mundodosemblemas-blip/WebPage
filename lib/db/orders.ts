import "server-only";

// Server-side order access. Runs under the service-role key, so this is the
// only place orders can be read or written — the browser has no access to the
// table at all. Every function here is called from a route handler in app/api/.

import { normalizeCVPhone } from "../phone";
import { supabaseAdmin } from "../supabase-admin";
import type { Order, OrderItem, OrderStatus } from "../types";

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
  status: OrderStatus;
  confirmed_at: string | null;
  edit_token: string;
  created_at: string;
  updated_at: string;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function genCode(): string {
  const part = Math.random().toString(36).slice(2, 6).toUpperCase();
  return "MDE-" + part;
}

// edit_token never leaves the server except inside the emailed link, so it is
// deliberately absent from the Order type returned to callers.
function rowToOrder(row: OrderRow): Order {
  return {
    code: row.code,
    name: row.name ?? undefined,
    club: row.club ?? undefined,
    email: row.email,
    phone: row.phone,
    items: row.items ?? [],
    status: row.status,
    confirmedAt: row.confirmed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function findByCode(code: string): Promise<Order | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select()
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (error) throw error;
  return data ? rowToOrder(data as OrderRow) : null;
}

// Look up orders by email OR phone — either identifier is enough. At least one
// of the two must be non-empty.
export async function findOrders(email: string, phone: string): Promise<Order[]> {
  const e = norm(email);
  const p = normalizeCVPhone(phone);
  if (!e && !p) return [];

  let query = supabaseAdmin().from(TABLE).select();
  if (e && p) query = query.or("email_key.eq." + e + ",phone_key.eq." + p);
  else if (e) query = query.eq("email_key", e);
  else query = query.eq("phone_key", p);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(rowToOrder);
}

// Admin: every order, newest first, optionally filtered by status.
export async function listAllOrders(status?: OrderStatus): Promise<Order[]> {
  let query = supabaseAdmin().from(TABLE).select();
  if (status) query = query.eq("status", status);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return (data as OrderRow[]).map(rowToOrder);
}

// The secret used to build the "open my order" link in the confirmation email.
export async function getEditToken(code: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin()
    .from(TABLE)
    .select("edit_token")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return (data as { edit_token: string } | null)?.edit_token ?? null;
}

// Checks that a token matches the order it claims to open.
export async function verifyEditToken(code: string, token: string): Promise<boolean> {
  if (!token) return false;
  const actual = await getEditToken(code);
  return Boolean(actual) && actual === token;
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export type NewOrder = {
  name?: string;
  club?: string;
  email: string;
  phone: string;
  items: OrderItem[];
};

export async function createOrder(data: NewOrder): Promise<Order> {
  const base = {
    name: data.name ?? null,
    club: data.club ?? null,
    email: data.email,
    phone: data.phone,
    email_key: norm(data.email),
    phone_key: normalizeCVPhone(data.phone),
    items: data.items,
    status: "pending" as const,
  };

  // Generate a code and insert; retry on the rare unique-code collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: row, error } = await supabaseAdmin()
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

// Thrown when a customer tries to change an order that has already been
// confirmed or cancelled. Route handlers turn this into a 409.
export class OrderLockedError extends Error {
  constructor(public orderStatus: OrderStatus) {
    super("Order is " + orderStatus + " and can no longer be changed by the customer.");
    this.name = "OrderLockedError";
  }
}

// THE EDIT LOCK. A customer edit lands only while the order is still pending.
// The status is checked up front for a clear error message, and again inside
// the UPDATE itself via .eq("status", "pending"), so a customer saving at the
// same moment the admin confirms cannot slip past the check.
export async function updateOrderAsCustomer(
  code: string,
  patch: { items?: OrderItem[]; name?: string; club?: string; phone?: string }
): Promise<Order | null> {
  const current = await findByCode(code);
  if (!current) return null;
  if (current.status !== "pending") throw new OrderLockedError(current.status);

  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.items !== undefined) update.items = patch.items;
  if (patch.name !== undefined) update.name = patch.name || null;
  if (patch.club !== undefined) update.club = patch.club || null;
  if (patch.phone !== undefined) {
    update.phone = patch.phone;
    update.phone_key = normalizeCVPhone(patch.phone);
  }

  const { data: row, error } = await supabaseAdmin()
    .from(TABLE)
    .update(update)
    .eq("code", code)
    .eq("status", "pending")
    .select()
    .maybeSingle();

  if (error) throw error;
  if (!row) {
    // No row came back: the status changed between the check and the write.
    const now = await findByCode(code);
    throw new OrderLockedError(now?.status ?? "confirmed");
  }
  return rowToOrder(row as OrderRow);
}

// Admin-only: move an order through its lifecycle. Not subject to the lock.
export async function setOrderStatus(
  code: string,
  status: OrderStatus
): Promise<Order | null> {
  const { data: row, error } = await supabaseAdmin()
    .from(TABLE)
    .update({
      status,
      confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("code", code)
    .select()
    .maybeSingle();

  if (error) throw error;
  return row ? rowToOrder(row as OrderRow) : null;
}

// Admin-only: edit any order regardless of status.
export async function updateOrderAsAdmin(
  code: string,
  patch: {
    items?: OrderItem[];
    name?: string;
    club?: string;
    email?: string;
    phone?: string;
  }
): Promise<Order | null> {
  const update: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.items !== undefined) update.items = patch.items;
  if (patch.name !== undefined) update.name = patch.name || null;
  if (patch.club !== undefined) update.club = patch.club || null;
  if (patch.email !== undefined) {
    update.email = patch.email;
    update.email_key = norm(patch.email);
  }
  if (patch.phone !== undefined) {
    update.phone = patch.phone;
    update.phone_key = normalizeCVPhone(patch.phone);
  }

  const { data: row, error } = await supabaseAdmin()
    .from(TABLE)
    .update(update)
    .eq("code", code)
    .select()
    .maybeSingle();

  if (error) throw error;
  return row ? rowToOrder(row as OrderRow) : null;
}

export async function deleteOrder(code: string): Promise<void> {
  const { error } = await supabaseAdmin().from(TABLE).delete().eq("code", code);
  if (error) throw error;
}
