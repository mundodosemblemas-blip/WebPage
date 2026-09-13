import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  issueSession,
  passwordMatches,
} from "@/lib/admin-auth";

// POST   -> exchange the admin password for a signed, httpOnly session cookie.
// DELETE -> log out by clearing that cookie.
//
// The cookie is what the admin API routes check; the browser never holds
// anything that grants access on its own.

export async function POST(request: Request) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { ok: false, error: "ADMIN_PASSWORD não configurado no servidor." },
      { status: 500 }
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    // ignore malformed body
  }

  if (!passwordMatches(password)) {
    return NextResponse.json(
      { ok: false, error: "Senha incorreta." },
      { status: 401 }
    );
  }

  const { value, maxAge } = issueSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
