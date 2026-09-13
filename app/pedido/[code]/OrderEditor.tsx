"use client";

// One customer's order. Editable only while it is pending — once the admin
// confirms or cancels it, this becomes a read-only receipt.
//
// The server enforces that rule; this component only decides what to show. If
// the order is confirmed between loading the page and pressing save, the PATCH
// comes back 409 and the screen switches to the locked state.

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import StoreHeader from "../../components/StoreHeader";
import { notifyOrder } from "@/lib/notify";
import {
  FALLBACK_IMAGE,
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  formatCVE,
  isCustomerEditable,
  type Order,
  type Product,
} from "@/lib/types";

type Draft = Record<string, number>; // productId -> qty

function Editor({ code, products }: { code: string; products: Product[] }) {
  const token = useSearchParams().get("token") ?? "";

  const [order, setOrder] = useState<Order | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);
  const [adding, setAdding] = useState(false);

  const applyOrder = useCallback((o: Order) => {
    setOrder(o);
    const d: Draft = {};
    for (const it of o.items) d[it.pinId] = it.qty;
    setDraft(d);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoadError("Link inválido. Procure o seu pedido pelo e-mail ou telefone.");
      setLoading(false);
      return;
    }
    let alive = true;
    fetch("/api/orders/" + encodeURIComponent(code) + "?token=" + encodeURIComponent(token))
      .then(async (res) => {
        const data = await res.json();
        if (!alive) return;
        if (!res.ok) {
          setLoadError(
            res.status === 403
              ? "Link inválido ou expirado. Procure o seu pedido pelo e-mail ou telefone."
              : data.error ?? "Não foi possível carregar o pedido."
          );
          return;
        }
        applyOrder(data.order);
      })
      .catch(() => alive && setLoadError("Falha de ligação. Tente novamente."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [code, token, applyOrder]);

  // Lines are shown from the order's own snapshot, so an item whose product was
  // hidden or deleted still appears with the name and price that were ordered.
  const lines = useMemo(() => {
    if (!order) return [];
    const byId = new Map(products.map((p) => [p.id, p]));
    const seen = new Set<string>();

    const fromOrder = order.items.map((it) => {
      seen.add(it.pinId);
      const product = byId.get(it.pinId);
      return {
        productId: it.pinId,
        name: it.name ?? product?.name ?? it.pinId,
        price: it.price ?? product?.price ?? 0,
        image: product?.image ?? null,
        qty: draft[it.pinId] ?? 0,
      };
    });

    // Products added during this editing session.
    const added = Object.keys(draft)
      .filter((id) => !seen.has(id) && draft[id] > 0)
      .map((id) => {
        const p = byId.get(id);
        return {
          productId: id,
          name: p?.name ?? id,
          price: p?.price ?? 0,
          image: p?.image ?? null,
          qty: draft[id],
        };
      });

    return [...fromOrder, ...added];
  }, [order, products, draft]);

  const { total, count } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const l of lines) {
      total += l.price * l.qty;
      count += l.qty;
    }
    return { total, count };
  }, [lines]);

  function setQty(productId: string, qty: number) {
    setSaved(false);
    setDraft((d) => {
      const next = { ...d };
      if (qty <= 0) next[productId] = 0;
      else next[productId] = Math.min(qty, 999);
      return next;
    });
  }

  async function save() {
    if (!order || saving) return;
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/orders/" + encodeURIComponent(code), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          items: Object.entries(draft)
            .filter(([, qty]) => qty > 0)
            .map(([productId, qty]) => ({ productId, qty })),
        }),
      });
      const data = await res.json();

      // The admin confirmed it while this page was open.
      if (res.status === 409) {
        setOrder({ ...order, status: data.status ?? "confirmed" });
        setSaveError(data.message ?? "Este pedido já não pode ser alterado.");
        return;
      }
      if (!res.ok) {
        setSaveError(data.error ?? "Não foi possível salvar as alterações.");
        return;
      }

      applyOrder(data.order);
      notifyOrder(code, "updated");
      setSaved(true);
      setAdding(false);
    } catch {
      setSaveError("Falha de ligação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  /* ---------- Loading / no access ---------- */
  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-surface">
        <StoreHeader title="O meu pedido" back showCart={false} />
        <p className="text-center text-on-surface-variant py-16">
          A carregar o pedido…
        </p>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
        <StoreHeader title="O meu pedido" back showCart={false} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-margin-mobile py-10 flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-error-container text-on-error-container grid place-items-center">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
            {loadError}
          </p>
          <Link
            href="/pedido"
            className="bg-primary text-on-primary px-6 py-3.5 rounded-xl font-label-md text-label-md"
          >
            Procurar o meu pedido
          </Link>
        </main>
      </div>
    );
  }

  const editable = isCustomerEditable(order);
  const statusLabel = ORDER_STATUS_LABEL[order.status] ?? order.status;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface pb-40">
      <StoreHeader title={"Pedido " + order.code} back showCart={false} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-margin-mobile py-6 flex flex-col gap-5">
        {/* Status — the single most important thing on this page. */}
        <div className="bg-surface-container-lowest rounded-xl card-shadow p-4 flex items-start gap-3">
          <span
            className={
              "px-3 py-1 rounded-full font-label-sm text-[11px] uppercase tracking-wide flex-none " +
              (ORDER_STATUS_BADGE[order.status] ?? "")
            }
          >
            {statusLabel}
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant flex-1">
            {order.status === "pending" &&
              "Ainda pode alterar este pedido. Assim que o confirmarmos, deixa de ser possível editá-lo aqui."}
            {order.status === "confirmed" &&
              "Este pedido foi confirmado e já não pode ser alterado online. Fale connosco para qualquer mudança."}
            {order.status === "cancelled" &&
              "Este pedido foi cancelado. Se foi engano, fale connosco."}
          </p>
        </div>

        {saved && (
          <div className="bg-primary-container text-on-primary-container rounded-xl px-4 py-3 font-label-md text-label-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">
              check_circle
            </span>
            Alterações guardadas.
          </div>
        )}

        {/* Items */}
        <section className="flex flex-col gap-3">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider pl-1">
            Itens
          </h2>
          <div className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-4">
            {lines.filter((l) => l.qty > 0 || editable).map((line) => (
              <div key={line.productId} className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-lg bg-surface-container-low overflow-hidden flex-none">
                  <img
                    src={line.image || FALLBACK_IMAGE}
                    alt={line.name}
                    onError={(e) => {
                      if (e.currentTarget.src !== FALLBACK_IMAGE)
                        e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body-md text-body-md text-on-surface truncate">
                    {line.name}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {formatCVE(line.price)} cada
                  </div>
                </div>

                {editable ? (
                  <div className="flex items-center bg-surface-container rounded-full p-1 border border-outline-variant/20 flex-none">
                    <button
                      aria-label={"Diminuir " + line.name}
                      disabled={line.qty <= 0}
                      onClick={() => setQty(line.productId, line.qty - 1)}
                      className="stepper-btn w-8 h-8 grid place-items-center rounded-full bg-surface-container-lowest text-on-surface shadow-sm disabled:opacity-40 disabled:shadow-none"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        remove
                      </span>
                    </button>
                    <span className="w-8 text-center font-label-md text-label-md text-primary">
                      {line.qty}
                    </span>
                    <button
                      aria-label={"Aumentar " + line.name}
                      onClick={() => setQty(line.productId, line.qty + 1)}
                      className="stepper-btn w-8 h-8 grid place-items-center rounded-full bg-primary text-on-primary shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                    </button>
                  </div>
                ) : (
                  <div className="text-right flex-none">
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      x {line.qty}
                    </div>
                    <div className="font-label-md text-label-md text-on-surface">
                      {formatCVE(line.price * line.qty)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Add more products — only while the order is still open. */}
        {editable && (
          <section className="flex flex-col gap-3">
            <button
              onClick={() => setAdding((a) => !a)}
              className="flex items-center justify-between bg-surface-container-lowest rounded-xl card-shadow p-4 text-left"
            >
              <span className="font-label-md text-label-md text-primary">
                Adicionar mais produtos
              </span>
              <span className="material-symbols-outlined text-primary">
                {adding ? "expand_less" : "expand_more"}
              </span>
            </button>

            {adding && (
              <div className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-4">
                {products
                  .filter((p) => (draft[p.id] ?? 0) === 0)
                  .map((p) => (
                    <div key={p.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface-container-low overflow-hidden flex-none">
                        <img
                          src={p.image || FALLBACK_IMAGE}
                          alt={p.name}
                          loading="lazy"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-body-md text-body-md truncate">
                          {p.name}
                        </div>
                        <div className="font-label-sm text-label-sm text-on-surface-variant">
                          {formatCVE(p.price)}
                        </div>
                      </div>
                      <button
                        onClick={() => setQty(p.id, 1)}
                        className="flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-2 rounded-xl font-label-md text-label-md active:scale-95 transition-transform flex-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          add
                        </span>
                        Juntar
                      </button>
                    </div>
                  ))}
                {products.every((p) => (draft[p.id] ?? 0) > 0) && (
                  <p className="text-center text-on-surface-variant font-body-md text-body-md py-2">
                    Já tem todos os produtos disponíveis no pedido.
                  </p>
                )}
              </div>
            )}
          </section>
        )}

        {!editable && (
          <Link
            href="/produtos"
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl text-center font-label-md text-label-md"
          >
            Fazer um novo pedido
          </Link>
        )}
      </main>

      {/* Save bar — only when there is something to save. */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-surface-container-highest rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-safe border-t border-outline-variant/20">
        <div className="max-w-2xl mx-auto w-full px-margin-mobile py-4 flex flex-col gap-2">
          {saveError && (
            <p className="text-error font-label-sm text-label-sm">{saveError}</p>
          )}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                Total · {count} {count === 1 ? "item" : "itens"}
              </span>
              <span className="font-headline-md text-headline-md text-primary">
                {formatCVE(total)}
              </span>
            </div>
            {editable && (
              <button
                onClick={save}
                disabled={saving || count === 0}
                className="flex-1 max-w-xs bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim transition-colors py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 card-shadow disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[20px]">
                  save
                </span>
                <span className="font-label-md text-label-md">
                  {saving ? "A guardar…" : "Guardar alterações"}
                </span>
              </button>
            )}
          </div>
          {editable && count === 0 && (
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              O pedido precisa de pelo menos um item. Para o cancelar, fale
              connosco.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for static rendering.
export default function OrderEditor(props: { code: string; products: Product[] }) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-surface" />}>
      <Editor {...props} />
    </Suspense>
  );
}
