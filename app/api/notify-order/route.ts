import { NextResponse } from "next/server";
import { findByCode } from "@/lib/storage";
import { sendOrderEmail, type OrderEvent } from "@/lib/email";

// Sends the order confirmation email. Looks the order up server-side by code so
// the email always goes to the address stored on the order (never an arbitrary
// address the client could supply). Always returns 200 so it can't break the
// order flow; the body's `ok` reflects whether the email actually went out.
export async function POST(request: Request) {
  let code = "";
  let event: OrderEvent = "created";
  try {
    const body = await request.json();
    code = typeof body?.code === "string" ? body.code : "";
    if (body?.event === "updated") event = "updated";
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
    const result = await sendOrderEmail(order, event);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[notify-order] failed", err);
    return NextResponse.json({ ok: false, error: "send failed" });
  }
}
