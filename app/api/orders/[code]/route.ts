import { NextResponse } from "next/server";
import {
  OrderLockedError,
  findByCode,
  updateOrderAsCustomer,
  verifyEditToken,
} from "@/lib/db/orders";
import { listProducts } from "@/lib/db/products";
import { ORDER_STATUS_LABEL, type OrderItem } from "@/lib/types";

// GET   /api/orders/<code>?token=... — read one order
// PATCH /api/orders/<code>           — change it, only while it is pending
//
// Both require the order's edit token, which the customer gets either from the
// lookup route (by proving they know the email/phone) or from the link in their
// confirmation email. Without it, knowing an order code is not enough.

type Ctx = { params: Promise<{ code: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const { code } = await params;
  const token = new URL(request.url).searchParams.get("token") ?? "";

  if (!(await verifyEditToken(code, token))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const order = await findByCode(code);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { code } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const token = String(body.token ?? "");
  if (!(await verifyEditToken(code, token))) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  // Same rule as placing an order: prices come from the catalog, not the client.
  const lines = Array.isArray(body.items)
    ? (body.items as { productId?: unknown; qty?: unknown }[])
    : [];
  const catalog = await listProducts({ activeOnly: true });
  const byId = new Map(catalog.map((p) => [p.id, p]));

  // An item whose product has since been hidden or deleted keeps its original
  // snapshot, so editing an order never silently drops lines from it.
  const existing = await findByCode(code);
  if (!existing) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  const snapshots = new Map(existing.items.map((it) => [it.pinId, it]));

  const items: OrderItem[] = [];
  for (const line of lines) {
    const id = String(line.productId ?? "");
    const qty = Math.floor(Number(line.qty));
    if (!Number.isFinite(qty) || qty <= 0) continue;

    const product = byId.get(id);
    const snapshot = snapshots.get(id);
    if (product) {
      items.push({ pinId: id, name: product.name, price: product.price, qty: Math.min(qty, 999) });
    } else if (snapshot) {
      items.push({ ...snapshot, qty: Math.min(qty, 999) });
    }
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "O pedido precisa de pelo menos um item." },
      { status: 400 }
    );
  }

  try {
    const order = await updateOrderAsCustomer(code, { items });
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    if (err instanceof OrderLockedError) {
      const label = ORDER_STATUS_LABEL[err.orderStatus] ?? err.orderStatus;
      return NextResponse.json(
        {
          error: "locked",
          status: err.orderStatus,
          message:
            "Este pedido já foi " +
            label.toLowerCase() +
            " e não pode mais ser alterado. Fale connosco para o mudar.",
        },
        { status: 409 }
      );
    }
    console.error("[api/orders/code] update failed", err);
    return NextResponse.json(
      { error: "Não foi possível salvar as alterações." },
      { status: 500 }
    );
  }
}
