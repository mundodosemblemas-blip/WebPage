import { NextResponse } from "next/server";
import { findOrders, getEditToken } from "@/lib/db/orders";

// POST /api/orders/lookup — find a customer's orders by email or phone.
//
// POST rather than GET so the email and phone stay out of URLs, browser history
// and server access logs. Proving you know the contact details is what earns
// you the per-order edit tokens returned here; those tokens are then required
// to view or change an individual order.

export async function POST(request: Request) {
  let email = "";
  let phone = "";
  try {
    const body = await request.json();
    email = String(body?.email ?? "").trim();
    phone = String(body?.phone ?? "").trim();
  } catch {
    // ignore malformed body
  }

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Informe o e-mail ou o telefone." },
      { status: 400 }
    );
  }

  try {
    const orders = await findOrders(email, phone);
    const withTokens = await Promise.all(
      orders.map(async (order) => ({
        order,
        token: await getEditToken(order.code),
      }))
    );
    return NextResponse.json({ results: withTokens });
  } catch (err) {
    console.error("[api/orders/lookup] failed", err);
    return NextResponse.json(
      { error: "Não foi possível buscar o pedido. Tente novamente." },
      { status: 500 }
    );
  }
}
