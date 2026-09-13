import "server-only";

// Order emails, sent over Gmail SMTP with an app password. Sending is
// fail-soft: callers get { ok } and this never throws, so a mail outage can
// never break an order.

import nodemailer from "nodemailer";
import { SITE_URL } from "./site";
import { formatCVE, orderCount, orderTotal, type Order } from "./types";

// created   — the customer just placed it, and can still edit it
// updated   — the customer changed it themselves
// confirmed — the admin approved it; editing is now closed
// cancelled — the admin cancelled it
export type OrderEvent = "created" | "updated" | "confirmed" | "cancelled";

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

const HEADING: Record<OrderEvent, string> = {
  created: "Pedido recebido",
  updated: "Pedido atualizado",
  confirmed: "Pedido confirmado",
  cancelled: "Pedido cancelado",
};

// What the customer can do next, which depends entirely on whether the order is
// still editable.
const INTRO: Record<OrderEvent, string> = {
  created:
    "Recebemos o seu pedido. Ainda pode alterá-lo até nós o confirmarmos.",
  updated: "As suas alterações foram guardadas.",
  confirmed:
    "O seu pedido foi confirmado e já não pode ser alterado online. " +
    "Se precisar de mudar alguma coisa, fale connosco.",
  cancelled: "O seu pedido foi cancelado.",
};

// The direct link back into the order. Only included while the order is still
// editable — once it is confirmed or cancelled the page is read-only anyway.
function orderLink(order: Order, token: string | null): string | null {
  if (!token) return null;
  return SITE_URL + "/pedido/" + encodeURIComponent(order.code) + "?token=" + token;
}

function buildContent(order: Order, event: OrderEvent, token: string | null) {
  const heading = HEADING[event];
  const subject = heading + " — " + order.code;
  const total = orderTotal(order);
  const count = orderCount(order);
  const link = orderLink(order, token);
  const canEdit = event === "created" || event === "updated";

  // Plain-text version (fallback for clients that do not render HTML).
  const textLines = order.items.map(
    (it) =>
      "- " +
      (it.name ?? it.pinId) +
      " x " +
      it.qty +
      " = " +
      formatCVE((it.price ?? 0) * it.qty)
  );
  const text = [
    heading,
    "",
    INTRO[event],
    "",
    "Código do pedido: " + order.code,
    "",
    "Itens (" + count + "):",
    ...textLines,
    "",
    "Total: " + formatCVE(total),
    ...(link && canEdit ? ["", "Ver ou alterar o seu pedido: " + link] : []),
    "",
    "Mundo de Emblemas",
  ].join("\n");

  const rows = order.items
    .map(
      (it) =>
        '<tr><td style="padding:8px 0;border-bottom:1px solid #eee;color:#1a1c1d;">' +
        escapeHtml(it.name ?? it.pinId) +
        '<span style="color:#777;"> x ' +
        it.qty +
        "</span></td>" +
        '<td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;color:#1a1c1d;white-space:nowrap;">' +
        formatCVE((it.price ?? 0) * it.qty) +
        "</td></tr>"
    )
    .join("");

  const button =
    link && canEdit
      ? '<div style="text-align:center;margin:24px 0;">' +
        '<a href="' +
        link +
        '" style="display:inline-block;background:#002D72;color:#ffffff;text-decoration:none;' +
        'padding:14px 28px;border-radius:12px;font-weight:700;font-size:15px;">' +
        "Ver ou alterar o meu pedido</a></div>"
      : "";

  const html =
    '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1c1d;">' +
    '<div style="text-align:center;margin-bottom:16px;">' +
    '<div style="font-size:22px;font-weight:800;color:#002D72;">Mundo de Emblemas</div></div>' +
    '<h2 style="margin:0 0 4px;font-size:20px;">' +
    heading +
    "</h2>" +
    '<p style="margin:0 0 16px;color:#555;">' +
    INTRO[event] +
    "</p>" +
    '<div style="background:#eef3ff;border:1px dashed #002D72;border-radius:12px;padding:14px;text-align:center;margin-bottom:16px;">' +
    '<div style="font-size:11px;letter-spacing:0.05em;text-transform:uppercase;color:#777;">Código do pedido</div>' +
    '<div style="font-size:24px;font-weight:800;color:#002D72;letter-spacing:0.05em;">' +
    escapeHtml(order.code) +
    "</div></div>" +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;">' +
    rows +
    '<tr><td style="padding:12px 0 0;font-weight:800;">Total (' +
    count +
    " itens)</td>" +
    '<td style="padding:12px 0 0;text-align:right;font-weight:800;color:#002D72;">' +
    formatCVE(total) +
    "</td></tr></table>" +
    button +
    "</div>";

  return { subject, text, html };
}

// Sends to the customer (order.email) with a copy bcc'd to the admin.
// Returns { ok } and never throws.
export async function sendOrderEmail(
  order: Order,
  event: OrderEvent,
  token: string | null = null
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!isConfigured()) {
    console.warn(
      "[email] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping order email."
    );
    return { ok: false, skipped: true };
  }
  try {
    const { subject, text, html } = buildContent(order, event, token);
    await getTransport().sendMail({
      from: '"Mundo de Emblemas" <' + GMAIL_USER + ">",
      to: order.email,
      bcc:
        ADMIN_NOTIFY_EMAIL && ADMIN_NOTIFY_EMAIL !== order.email
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
