import { NextResponse } from "next/server";

// Soft admin gate: compares the submitted password to ADMIN_PASSWORD (a
// server-only env var, so it never ships to the browser). This only hides the
// admin UI — data access still uses the public anon key, so it is not hard
// security. Move to Supabase Auth + a service key for real protection.
export async function POST(request: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
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

  if (password && password === expected) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json(
    { ok: false, error: "Senha incorreta." },
    { status: 401 }
  );
}
