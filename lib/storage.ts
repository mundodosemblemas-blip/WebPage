// Prototype persistence layer backed by localStorage. This is where you would
// later swap in a real backend (Google Sheets API, Supabase, etc.) — keep the
// same function signatures and the UI won't need to change.

import { PIN_MAP } from "./pins";
import { normalizeCVPhone } from "./phone";

export interface OrderItem {
  pinId: string;
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

const KEY = "mde_orders";

function readAll(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch {
    return [];
  }
}

function writeAll(orders: Order[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(orders));
}

function genCode(): string {
  const part = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `MDE-${part}`;
}

export function createOrder(
  data: Omit<Order, "code" | "createdAt" | "updatedAt">
): Order {
  const now = new Date().toISOString();
  const orders = readAll();
  let code = genCode();
  while (orders.some((o) => o.code === code)) code = genCode();
  const order: Order = { ...data, code, createdAt: now, updatedAt: now };
  orders.push(order);
  writeAll(orders);
  return order;
}

export function updateOrder(
  code: string,
  patch: Partial<Pick<Order, "items" | "name" | "club" | "email" | "phone">>
): Order | null {
  const orders = readAll();
  const idx = orders.findIndex((o) => o.code === code);
  if (idx === -1) return null;
  orders[idx] = {
    ...orders[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeAll(orders);
  return orders[idx];
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

function normPhone(s: string): string {
  return normalizeCVPhone(s);
}

// Look up orders by email + phone (the order's "identity" per the spec).
export function findOrders(email: string, phone: string): Order[] {
  const e = norm(email);
  const p = normPhone(phone);
  return readAll().filter(
    (o) => norm(o.email) === e && normPhone(o.phone) === p
  );
}

export function findByCode(code: string): Order | null {
  const c = code.trim().toUpperCase();
  return readAll().find((o) => o.code === c) ?? null;
}

export function orderTotal(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, it) => {
    const pin = PIN_MAP[it.pinId];
    return sum + (pin ? pin.price * it.qty : 0);
  }, 0);
}

export function orderCount(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, it) => sum + it.qty, 0);
}
