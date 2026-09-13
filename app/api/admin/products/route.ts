import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { createProduct, listProductsAdmin } from "@/lib/db/products";
import { PRODUCT_TYPES, type ProductType } from "@/lib/types";

// GET  /api/admin/products — every product, including hidden ones, in the
//                            admin shape (supplier cost and packing weight).
// POST /api/admin/products — create one.

function parseType(value: unknown): ProductType {
  return PRODUCT_TYPES.some((t) => t.value === value)
    ? (value as ProductType)
    : "outro";
}

// A blank input means "not recorded", which is a null column rather than a zero.
function optionalNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function optionalInt(value: unknown): number | null {
  const n = optionalNumber(value);
  return n === null ? null : Math.round(n);
}

function optionalText(value: unknown): string | null {
  const s = String(value ?? "").trim();
  return s || null;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    return NextResponse.json({ products: await listProductsAdmin() });
  } catch (err) {
    console.error("[api/admin/products] list failed", err);
    return NextResponse.json(
      { error: "Não foi possível carregar os produtos." },
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
  const price = Math.round(Number(body.price));
  if (!name) return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0) {
    return NextResponse.json({ error: "Preço de venda inválido." }, { status: 400 });
  }

  try {
    const product = await createProduct({
      name,
      slug: optionalText(body.slug),
      description: optionalText(body.description),
      type: parseType(body.type),
      price,
      image: optionalText(body.image),
      size: optionalText(body.size),
      finish: optionalText(body.finish),
      clubId: optionalText(body.clubId),
      costUsd50: optionalNumber(body.costUsd50),
      costUsd100: optionalNumber(body.costUsd100),
      pkgWeightG: optionalInt(body.pkgWeightG),
      active: body.active !== false,
      sortOrder: Number(body.sortOrder) || 0,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[api/admin/products] create failed", err);
    return NextResponse.json(
      { error: "Não foi possível salvar o produto." },
      { status: 500 }
    );
  }
}
