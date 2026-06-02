"use client";

import { useEffect, useState } from "react";
import {
  listAllOrders,
  deleteOrder,
  orderCount,
  orderTotal,
  type Order,
} from "@/lib/storage";
import { formatCVE } from "@/lib/products";

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

export default function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setOrders(await listAllOrders());
    } catch (e) {
      console.error("Falha ao carregar pedidos", e);
      setError("Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(code: string) {
    if (!confirm(`Apagar o pedido ${code}? Esta ação não pode ser desfeita.`))
      return;
    try {
      await deleteOrder(code);
      setOrders((o) => o.filter((x) => x.code !== code));
    } catch (e) {
      console.error("Falha ao apagar o pedido", e);
      alert("Não foi possível apagar o pedido.");
    }
  }

  const grandTotal = orders.reduce((s, o) => s + orderTotal(o), 0);
  const grandItems = orders.reduce((s, o) => s + orderCount(o), 0);

  if (loading)
    return (
      <p className="text-center text-on-surface-variant py-10">
        A carregar pedidos…
      </p>
    );
  if (error)
    return (
      <div className="text-center py-10">
        <p className="text-error mb-3">{error}</p>
        <button
          onClick={load}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md"
        >
          Tentar novamente
        </button>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[140px] bg-surface-container-lowest rounded-xl card-shadow p-4">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Pedidos
          </div>
          <div className="font-headline-md text-headline-md text-primary">
            {orders.length}
          </div>
        </div>
        <div className="flex-1 min-w-[140px] bg-surface-container-lowest rounded-xl card-shadow p-4">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Itens
          </div>
          <div className="font-headline-md text-headline-md text-primary">
            {grandItems}
          </div>
        </div>
        <div className="flex-1 min-w-[140px] bg-surface-container-lowest rounded-xl card-shadow p-4">
          <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
            Total
          </div>
          <div className="font-headline-md text-headline-md text-primary">
            {formatCVE(grandTotal)}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          Todos os pedidos
        </h2>
        <button
          onClick={load}
          className="flex items-center gap-1 text-primary font-label-sm text-label-sm px-2 py-1 rounded-lg hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Atualizar
        </button>
      </div>

      {orders.length === 0 && (
        <p className="text-center text-on-surface-variant py-8">
          Ainda não há pedidos.
        </p>
      )}

      {orders.map((o) => {
        const open = expanded === o.code;
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
                <div className="flex items-center gap-2">
                  <span className="font-label-md text-label-md text-primary">
                    {o.code}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    · {formatDate(o.createdAt)}
                  </span>
                </div>
                <div className="font-body-md text-body-md text-on-surface truncate">
                  {o.email}
                </div>
                <div className="font-label-sm text-label-sm text-on-surface-variant">
                  {o.phone} · {orderCount(o)} itens
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
                          × {it.qty}
                        </span>
                      </span>
                      <span className="text-on-surface-variant">
                        {formatCVE((it.price ?? 0) * it.qty)}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => remove(o.code)}
                  className="mt-2 flex items-center gap-1 text-error font-label-sm text-label-sm px-2 py-1.5 rounded-lg hover:bg-error-container/40"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>
                  Apagar pedido
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
