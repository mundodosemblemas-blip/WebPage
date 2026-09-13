import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { deleteOrder, findByCode, setOrderStatus } from "@/lib/db/orders";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

// PATCH  /api/admin/orders/<code>  { status } — confirm or cancel an order
// DELETE /api/admin/orders/<code>            — remove it entirely
//
// Confirming is what closes the customer edit window: from that moment
// updateOrderAsCustomer refuses to write.

type Ctx = { params: Promise<{ code: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { code } = await params;

  let status: string | undefined;
  try {
    const body = await request.json();
    status = typeof body?.status === "string" ? body.status : undefined;
  } catch {
    // ignore malformed body
  }

  if (!ORDER_STATUSES.some((s) => s.value === status)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  try {
    const order = await setOrderStatus(code, status as OrderStatus);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[api/admin/orders/code] status change failed", err);
    return NextResponse.json(
      { error: "Não foi possível atualizar o pedido." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const { code } = await params;

  try {
    if (!(await findByCode(code))) {
      return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
    }
    await deleteOrder(code);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/admin/orders/code] delete failed", err);
    return NextResponse.json(
      { error: "Não foi possível apagar o pedido." },
      { status: 500 }
    );
  }
}
