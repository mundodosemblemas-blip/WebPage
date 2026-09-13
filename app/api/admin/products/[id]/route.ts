import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import {
  deleteProduct,
  updateProduct,
  type ProductInput,
} from "@/lib/db/products";
import { PRODUCT_TYPES } from "@/lib/types";

// PATCH  /api/admin/products/<id> — edit a product (partial)
// DELETE /api/admin/products/<id> — remove it from the catalog
//
// Only the keys present in the body are changed, so the hide/show toggle can
// send just { active } without resending the whole product. A key sent as an
// empty string clears that column.

type Ctx = { params: Promise<{ id: string }> };

function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function optionalText(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

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

  const patch: Partial<ProductInput> = {};

  if (body.name !== undefined) {
    const name = String(body.name).trim();
    if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
    patch.name = name;
  }
  if (body.price !== undefined) {
    const price = Math.round(Number(body.price));
    if (!Number.isFinite(price) || price < 0) {
      return NextResponse.json({ error: "Preço de venda inválido." }, { status: 400 });
    }
    patch.price = price;
  }
  if (body.type !== undefined && PRODUCT_TYPES.some((t) => t.value === body.type)) {
    patch.type = body.type as ProductInput["type"];
  }
  if (body.slug !== undefined) patch.slug = optionalText(body.slug);
  if (body.description !== undefined) patch.description = optionalText(body.description);
  if (body.image !== undefined) patch.image = optionalText(body.image);
  if (body.size !== undefined) patch.size = optionalText(body.size);
  if (body.finish !== undefined) patch.finish = optionalText(body.finish);
  if (body.clubId !== undefined) patch.clubId = optionalText(body.clubId);
  if (body.costUsd50 !== undefined) patch.costUsd50 = optionalNumber(body.costUsd50);
  if (body.costUsd100 !== undefined) patch.costUsd100 = optionalNumber(body.costUsd100);
  if (body.pkgWeightG !== undefined) {
    const w = optionalNumber(body.pkgWeightG);
    patch.pkgWeightG = w === null ? null : Math.round(w);
  }
  if (body.active !== undefined) patch.active = Boolean(body.active);
  if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder) || 0;

  try {
    const product = await updateProduct(id, patch);
    if (!product) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ product });
  } catch (err) {
    console.error("[api/admin/products/id] update failed", err);
    return NextResponse.json(
      { error: "Não foi possível salvar o produto." },
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
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/products/id] delete failed", err);
    return NextResponse.json(
      { error: "Não foi possível apagar o produto." },
      { status: 500 }
    );
  }
}
