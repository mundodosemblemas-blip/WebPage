// Server-only: sends order confirmation emails over Gmail SMTP using an app
// password. Never import this from client components. Sending is fail-soft —
// callers get { ok } and this never throws.

import nodemailer from "nodemailer";
import { orderCount, orderTotal, type Order } from "./storage";
import { formatCVE } from "./products";

export type OrderEvent = "created" | "updated";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || GMAIL_USER;

function isConfigured(): boolean {
  return Boolean(GMAIL_USER && GMAIL_APP_PASSWORD);
}

let transport: nodemailer.Transporter | null = null;
function getTransport(): nodemailer.Transporter {
  if (transport) return transport;
  transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  return transport;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildContent(order: Order, event: OrderEvent) {
  const heading =
    event === "created" ? "Pedido confirmado" : "Pedido atualizado";
  const subject = `${heading} — ${order.code}`;
  const total = orderTotal(order);
  const count = orderCount(order);

  // Plain-text version (fallback for clients that don't render HTML).
  const textLines = order.items.map(
    (it) =>
      `- ${it.name ?? it.pinId} × ${it.qty} = ${formatCVE((it.price ?? 0) * it.qty)}`
  );
  const text = [
    `${heading}`,
    ``,
    `Código do pedido: ${order.code}`,
    ``,
    `Itens (${count}):`,
    ...textLines,
    ``,
    `Total: ${formatCVE(total)}`,
    ``,
    `Para editar este pedido, use o seu e-mail ou telefone na opção "Editar pedido".`,
    ``,
    `Mundo de Emblemas`,
  ].join("\n");

  // HTML version.
  const rows = order.items
    .map(
      (it) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#1a1c1d;">
            ${escapeHtml(it.name ?? it.pinId)}
            <span style="color:#777;"> × ${it.qty}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#1a1c1d;white-space:nowrap;">
            ${formatCVE((it.price ?? 0) * it.qty)}
          </td>
        </tr>`
    )
    .join("");

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1c1d;">
    <div style="text-align:center;margin-bottom:16px;">
      <div style="font-size:22px;font-weight:800;color:#5e0081;">Mundo de Emblemas 🇨🇻</div>
    </div>
    <h2 style="margin:0 0 4px;font-size:20px;">${heading}</h2>
    <p style="margin:0 0 16px;color:#555;">Obrigado! Aqui está o resumo do seu pedido.</p>

    <div style="background:#f8d8ff;border:1px dashed #5e0081;border-radius:12px;padding:14px;text-align:center;margin-bottom:16px;">
      <div style="font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:#777;">Código do pedido</div>
      <div style="font-size:24px;font-weight:800;color:#46005f;letter-spacing:0.05em;">${escapeHtml(order.code)}</div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      ${rows}
      <tr>
        <td style="padding:12px 0 0;font-weight:800;">Total (${count} itens)</td>
        <td style="padding:12px 0 0;text-align:right;font-weight:800;color:#5e0081;">${formatCVE(total)}</td>
      </tr>
    </table>

    <p style="margin:20px 0 0;font-size:13px;color:#555;">
      Para editar este pedido, use o seu <strong>e-mail</strong> ou <strong>telefone</strong>
      na opção “Editar pedido” em nosso site: https://web-page-two-green.vercel.app/
    </p>
  </div>`;

  return { subject, text, html };
}

// Sends the confirmation to the customer (order.email), with a copy bcc'd to
// the admin. Returns { ok } and never throws.
export async function sendOrderEmail(
  order: Order,
  event: OrderEvent
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!isConfigured()) {
    console.warn(
      "[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping order email."
    );
    return { ok: false, skipped: true };
  }
  try {
    const { subject, text, html } = buildContent(order, event);
    await getTransport().sendMail({
      from: `"Mundo de Emblemas" <${GMAIL_USER}>`,
      to: order.email,
      bcc: ADMIN_NOTIFY_EMAIL && ADMIN_NOTIFY_EMAIL !== order.email
        ? ADMIN_NOTIFY_EMAIL
        : undefined,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error("[email] Failed to send order email", err);
    return { ok: false };
  }
}
