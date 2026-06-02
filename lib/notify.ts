// Client helper: ask the server to email the order confirmation. Fire-and-forget
// — failures are logged but never block the order flow.

export function notifyOrder(code: string, event: "created" | "updated"): void {
  fetch("/api/notify-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, event }),
  }).catch((err) => {
    console.warn("[notify] could not send order email", err);
  });
}
