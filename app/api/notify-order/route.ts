import { NextResponse } from "next/server";
import { findByCode, getEditToken } from "@/lib/db/orders";
import { sendOrderEmail, type OrderEvent } from "@/lib/email";

// POST /api/notify-order — send the confirmation email for an order.
//
// The order is looked up server-side by code, so the mail always goes to the
// address stored on the order and never to one the caller supplied. Always
// returns 200 so a mail failure cannot break the order flow; the body's `ok`
// says whether the message actually went out.

const EVENTS: OrderEvent[] = ["created", "updated", "confirmed", "cancelled"];

export async function POST(request: Request) {
  let code = "";
  let event: OrderEvent = "created";
  try {
    const body = await request.json();
    code = typeof body?.code === "string" ? body.code : "";
    if (EVENTS.includes(body?.event)) event = body.event as OrderEvent;
  } catch {
    // ignore malformed body
  }

  if (!code) {
    return NextResponse.json({ ok: false, error: "missing code" });
  }

  try {
    const order = await findByCode(code);
    if (!order) {
      return NextResponse.json({ ok: false, error: "order not found" });
    }
    // The token turns the email into a one-click way back into the order.
    const token = await getEditToken(order.code);
    return NextResponse.json(await sendOrderEmail(order, event, token));
  } catch (err) {
    console.error("[notify-order] failed", err);
    return NextResponse.json({ ok: false, error: "send failed" });
  }
}
