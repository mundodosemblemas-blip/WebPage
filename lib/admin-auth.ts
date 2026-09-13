import "server-only";

// Admin session as a signed, httpOnly cookie.
//
// The previous gate was a sessionStorage flag, which only hid the UI — anyone
// could set it, and the data calls went straight to Supabase anyway. Now the
// admin API routes verify this cookie server-side, so it is the actual
// authorisation boundary.
//
// The cookie value is "<expiry>.<hmac>", signed with ADMIN_PASSWORD. Nothing
// secret is stored in the cookie itself and it cannot be forged without the
// password. Changing ADMIN_PASSWORD invalidates every existing session.

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "mde_admin";
const SESSION_MS = 8 * 60 * 60 * 1000; // 8 hours

function secret(): string {
  const s = process.env.ADMIN_PASSWORD;
  if (!s) throw new Error("ADMIN_PASSWORD is not configured on the server.");
  return s;
}

function sign(expiry: number): string {
  return createHmac("sha256", secret()).update(String(expiry)).digest("hex");
}

// Length-safe comparison that does not leak where two strings differ.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function issueSession(): { value: string; maxAge: number } {
  const expiry = Date.now() + SESSION_MS;
  return { value: expiry + "." + sign(expiry), maxAge: Math.floor(SESSION_MS / 1000) };
}

export function isValidSession(value: string | undefined): boolean {
  if (!value) return false;
  const dot = value.indexOf(".");
  if (dot < 1) return false;

  const expiry = Number(value.slice(0, dot));
  const mac = value.slice(dot + 1);
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false;

  try {
    return safeEqual(mac, sign(expiry));
  } catch {
    return false; // ADMIN_PASSWORD missing
  }
}

// True when the current request carries a valid admin session.
export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  return isValidSession(store.get(ADMIN_COOKIE)?.value);
}

// Checks the password submitted on the login form.
export function passwordMatches(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !password) return false;
  return safeEqual(password, expected);
}
