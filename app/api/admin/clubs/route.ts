import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createClub, listClubs } from "@/lib/db/clubs";

// GET  /api/admin/clubs — every club, including hidden ones
// POST /api/admin/clubs — create one

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    return NextResponse.json({ clubs: await listClubs() });
  } catch (err) {
    console.error("[api/admin/clubs] list failed", err);
    return NextResponse.json(
      { error: "Não foi possível carregar os clubes." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Informe o nome do clube." }, { status: 400 });
  }

  try {
    const club = await createClub({
      name,
      slug: String(body.slug ?? "").trim() || null,
      active: body.active !== false,
      sortOrder: Number(body.sortOrder) || 0,
    });
    return NextResponse.json({ club }, { status: 201 });
  } catch (err) {
    console.error("[api/admin/clubs] create failed", err);
    return NextResponse.json(
      { error: "Não foi possível salvar o clube." },
      { status: 500 }
    );
  }
}
