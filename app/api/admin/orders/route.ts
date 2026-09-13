import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listAllOrders } from "@/lib/db/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

// GET /api/admin/orders?status=pending — the admin order list.
// Customer contact details live behind this route, so the session cookie is
// checked before anything is read.

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("status");
  const status = ORDER_STATUSES.some((s) => s.value === raw)
    ? (raw as OrderStatus)
    : undefined;

  try {
    return NextResponse.json({ orders: await listAllOrders(status) });
  } catch (err) {
    console.error("[api/admin/orders] list failed", err);
    return NextResponse.json(
      { error: "Não foi possível carregar os pedidos." },
      { status: 500 }
    );
  }
}
