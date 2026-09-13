"use client";

// Admin order list. Confirming an order is the action that closes the customer
// edit window, so it is the primary control here.

import { useCallback, useEffect, useState } from "react";
import { notifyOrder } from "@/lib/notify";
import {
  ORDER_STATUSES,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  formatCVE,
  orderCount,
  orderTotal,
  type Order,
  type OrderStatus,
} from "@/lib/types";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Filter = "all" | OrderStatus;

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [working, setWorking] = useState<string | null>(null);

  const load = useCallback(async (which: Filter) => {
    setLoading(true);
    setError("");
    try {
      const qs = which === "all" ? "" : "?status=" + which;
      const res = await fetch("/api/admin/orders" + qs);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível carregar os pedidos.");
        return;
      }
      setOrders(data.orders);
    } catch {
      setError("Falha de ligação.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(filter);
  }, [filter, load]);

  // Confirming or cancelling emails the customer, so they learn the order is
  // now locked without having to check the site.
  async function changeStatus(code: string, status: OrderStatus) {
    const label = (ORDER_STATUS_LABEL[status] ?? status).toLowerCase();
    if (!confirm("Marcar o pedido " + code + " como " + label + "?")) return;

    setWorking(code);
    try {
      const res = await fetch("/api/admin/orders/" + code, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Não foi possível atualizar o pedido.");
        return;
      }
      setOrders((list) =>
        list.map((o) => (o.code === code ? (data.order as Order) : o))
      );
      if (status === "confirmed" || status === "cancelled") {
        notifyOrder(code, status);
      }
    } catch {
      alert("Falha de ligação.");
    } finally {
      setWorking(null);
    }
  }

  async function remove(code: string) {
    if (!confirm("Apagar o pedido " + code + "? Esta ação não pode ser desfeita."))
      return;
    setWorking(code);
    try {
      const res = await fetch("/api/admin/orders/" + code, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Não foi possível apagar o pedido.");
        return;
      }
      setOrders((list) => list.filter((o) => o.code !== code));
    } catch {
      alert("Falha de ligação.");
    } finally {
      setWorking(null);
    }
  }

  const grandTotal = orders.reduce((s, o) => s + orderTotal(o), 0);
  const grandItems = orders.reduce((s, o) => s + orderCount(o), 0);
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <Stat label="Pedidos" value={String(orders.length)} />
        <Stat label="Por confirmar" value={String(pendingCount)} />
        <Stat label="Itens" value={String(grandItems)} />
        <Stat label="Total" value={formatCVE(grandTotal)} />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {([{ value: "all", label: "Todos" }, ...ORDER_STATUSES] as {
          value: Filter;
          label: string;
        }[]).map((s) => (
          <button
            key={s.value}
            onClick={() => setFilter(s.value)}
            className={
              "px-4 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-colors " +
              (filter === s.value
                ? "bg-primary text-on-primary"
                : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container")
            }
          >
            {s.label}
          </button>
        ))}
        <button
          onClick={() => load(filter)}
          className="ml-auto flex items-center gap-1 text-primary font-label-sm text-label-sm px-2 py-1 rounded-lg hover:bg-surface-container-low flex-none"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Atualizar
        </button>
      </div>

      {loading && (
        <p className="text-center text-on-surface-variant py-10">
          A carregar pedidos…
        </p>
      )}

      {error && (
        <div className="text-center py-10">
          <p className="text-error mb-3">{error}</p>
          <button
            onClick={() => load(filter)}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <p className="text-center text-on-surface-variant py-8">
          Nenhum pedido para mostrar.
        </p>
      )}

      {!loading &&
        !error &&
        orders.map((o) => {
          const open = expanded === o.code;
          const busy = working === o.code;
          return (
            <div
              key={o.code}
              className="bg-surface-container-lowest rounded-xl card-shadow overflow-hidden"
            >
              <button
                onClick={() => setExpanded(open ? null : o.code)}
                className="w-full text-left p-4 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-label-md text-label-md text-primary">
                      {o.code}
                    </span>
                    <span
                      className={
                        "px-2 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wide " +
                        (ORDER_STATUS_BADGE[o.status] ?? "")
                      }
                    >
                      {ORDER_STATUS_LABEL[o.status] ?? o.status}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {formatDate(o.createdAt)}
                    </span>
                  </div>
                  <div className="font-body-md text-body-md text-on-surface truncate">
                    {o.name ? o.name + " · " : ""}
                    {o.email}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    {o.phone}
                    {o.club ? " · " + o.club : ""} · {orderCount(o)} itens
                  </div>
                </div>
                <div className="text-right flex-none">
                  <div className="font-label-md text-label-md text-on-surface">
                    {formatCVE(orderTotal(o))}
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    {open ? "expand_less" : "expand_more"}
                  </span>
                </div>
              </button>

              {open && (
                <div className="px-4 pb-4 border-t border-surface-variant">
                  <div className="py-2 flex flex-col gap-1">
                    {o.items.map((it) => (
                      <div
                        key={it.pinId}
                        className="flex items-center justify-between font-body-md text-body-md"
                      >
                        <span className="text-on-surface">
                          {it.name ?? it.pinId}
                          <span className="text-on-surface-variant">
                            {" "}
                            x {it.qty}
                          </span>
                        </span>
                        <span className="text-on-surface-variant">
                          {formatCVE((it.price ?? 0) * it.qty)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    {o.status !== "confirmed" && (
                      <button
                        onClick={() => changeStatus(o.code, "confirmed")}
                        disabled={busy}
                        className="flex items-center gap-1 bg-primary text-on-primary font-label-md text-label-md px-3 py-2 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          check_circle
                        </span>
                        Confirmar
                      </button>
                    )}
                    {o.status !== "pending" && (
                      <button
                        onClick={() => changeStatus(o.code, "pending")}
                        disabled={busy}
                        className="flex items-center gap-1 bg-surface-container-high text-on-surface font-label-md text-label-md px-3 py-2 rounded-xl disabled:opacity-50"
                        title="Devolve o pedido ao cliente para edição"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          lock_open
                        </span>
                        Reabrir
                      </button>
                    )}
                    {o.status !== "cancelled" && (
                      <button
                        onClick={() => changeStatus(o.code, "cancelled")}
                        disabled={busy}
                        className="flex items-center gap-1 bg-surface-container-high text-on-surface-variant font-label-md text-label-md px-3 py-2 rounded-xl disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          block
                        </span>
                        Cancelar
                      </button>
                    )}
                    <button
                      onClick={() => remove(o.code)}
                      disabled={busy}
                      className="flex items-center gap-1 text-error font-label-md text-label-md px-3 py-2 rounded-xl hover:bg-error-container/40 disabled:opacity-50 ml-auto"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        delete
                      </span>
                      Apagar
                    </button>
                  </div>

                  {o.confirmedAt && (
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">
                      Confirmado em {formatDate(o.confirmedAt)}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 min-w-[130px] bg-surface-container-lowest rounded-xl card-shadow p-4">
      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
        {label}
      </div>
      <div className="font-headline-md text-headline-md text-primary">
        {value}
      </div>
    </div>
  );
}
