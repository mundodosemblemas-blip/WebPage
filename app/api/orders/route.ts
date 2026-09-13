import { NextResponse } from "next/server";
import { createOrder, findOrders } from "@/lib/db/orders";
import { listProducts } from "@/lib/db/products";
import { isValidCVPhone } from "@/lib/phone";
import type { OrderItem } from "@/lib/types";

// POST /api/orders — place an order.
//
// The client sends only product ids and quantities. Names and prices are
// resolved here from the catalog, never taken from the request, so a tampered
// payload cannot order a 5.000 CVE belt for 0 CVE. The resolved values are then
// snapshotted onto the order so it stays accurate if the product changes later.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type IncomingLine = { productId?: unknown; qty?: unknown };

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  const phone = String(body.phone ?? "").trim();
  const name = String(body.name ?? "").trim();
  const club = String(body.club ?? "").trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
  }
  if (!isValidCVPhone(phone)) {
    return NextResponse.json(
      { error: "Número inválido. Use um número de Cabo Verde (7 dígitos)." },
      { status: 400 }
    );
  }

  const lines = Array.isArray(body.items) ? (body.items as IncomingLine[]) : [];
  if (lines.length === 0) {
    return NextResponse.json({ error: "O carrinho está vazio." }, { status: 400 });
  }

  // Resolve every line against the live catalog.
  const catalog = await listProducts({ activeOnly: true });
  const byId = new Map(catalog.map((p) => [p.id, p]));

  const items: OrderItem[] = [];
  for (const line of lines) {
    const product = byId.get(String(line.productId ?? ""));
    const qty = Math.floor(Number(line.qty));
    if (!product || !Number.isFinite(qty) || qty <= 0) continue;
    items.push({
      pinId: product.id,
      name: product.name,
      price: product.price,
      qty: Math.min(qty, 999),
    });
  }

  if (items.length === 0) {
    return NextResponse.json(
      { error: "Nenhum dos produtos escolhidos está disponível." },
      { status: 400 }
    );
  }

  // A customer with an order still awaiting confirmation should edit that one
  // rather than create a second. Once an order is confirmed or cancelled they
  // are free to place a new one.
  const existing = await findOrders(email, phone);
  const pending = existing.find((o) => o.status === "pending");
  if (pending) {
    return NextResponse.json(
      { error: "pending-order-exists", code: pending.code },
      { status: 409 }
    );
  }

  try {
    const order = await createOrder({ email, phone, name, club, items });
    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    console.error("[api/orders] create failed", err);
    return NextResponse.json(
      { error: "Não foi possível salvar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}
