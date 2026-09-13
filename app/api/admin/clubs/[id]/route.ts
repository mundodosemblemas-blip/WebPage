import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { deleteClub, updateClub, type ClubInput } from "@/lib/db/clubs";

// PATCH  /api/admin/clubs/<id> — rename, reorder, hide or show a club
// DELETE /api/admin/clubs/<id> — remove it
//
// Deleting a club does not delete its products: the foreign key is
// "on delete set null", so those products simply end up with no club.

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const patch: Partial<ClubInput> = {};
  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) {
      return NextResponse.json({ error: "Informe o nome do clube." }, { status: 400 });
    }
    patch.name = name;
  }
  if (body.slug !== undefined) patch.slug = String(body.slug).trim() || null;
  if (body.active !== undefined) patch.active = Boolean(body.active);
  if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder) || 0;

  try {
    const club = await updateClub(id, patch);
    if (!club) {
      return NextResponse.json({ error: "Clube não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ club });
  } catch (err) {
    console.error("[api/admin/clubs/id] update failed", err);
    return NextResponse.json(
      { error: "Não foi possível salvar o clube." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { id } = await params;

  try {
    await deleteClub(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/clubs/id] delete failed", err);
    return NextResponse.json(
      { error: "Não foi possível apagar o clube." },
      { status: 500 }
    );
  }
}
