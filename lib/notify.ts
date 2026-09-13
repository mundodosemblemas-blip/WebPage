// Client helper: ask the server to email the customer about their order.
// Fire-and-forget — failures are logged but never block the order flow, since
// the order itself is already saved by the time this runs.

export type NotifyEvent = "created" | "updated" | "confirmed" | "cancelled";

export function notifyOrder(code: string, event: NotifyEvent): void {
  fetch("/api/notify-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, event }),
  }).catch((err) => {
    console.warn("[notify] could not send order email", err);
  });
}
