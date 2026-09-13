"use client";

import Link from "next/link";
import StoreHeader from "../components/StoreHeader";
import { useCart } from "@/lib/cart";
import { FALLBACK_IMAGE, formatCVE } from "@/lib/types";

export default function CarrinhoPage() {
  const { lines, ready, count, total, setQty, remove } = useCart();

  // Nothing is rendered until localStorage has been read, otherwise a full
  // cart would flash the empty state for a frame on every load.
  if (!ready) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-surface">
        <StoreHeader title="Carrinho" back showCart={false} />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
        <StoreHeader title="Carrinho" back showCart={false} />
        <main className="flex-1 flex flex-col items-center justify-center gap-4 px-margin-mobile text-center">
          <div className="w-20 h-20 rounded-full bg-surface-container-low grid place-items-center">
            <span className="material-symbols-outlined text-[40px] text-outline">
              shopping_cart
            </span>
          </div>
          <h2 className="font-headline-md text-headline-md">
            O seu carrinho está vazio
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
            Escolha os seus pins e emblemas na loja para começar a sua encomenda.
          </p>
          <Link
            href="/produtos"
            className="mt-2 bg-primary text-on-primary px-6 py-3.5 rounded-xl font-label-md text-label-md active:scale-95 transition-transform"
          >
            Ver a loja
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
      <StoreHeader title="Carrinho" subtitle={count + " itens"} back showCart={false} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-margin-mobile py-6 pb-40 flex flex-col gap-3">
        {lines.map((line) => (
          <div
            key={line.productId}
            className="bg-surface-container-lowest rounded-xl card-shadow p-3 flex gap-3 items-center border border-outline-variant/20"
          >
            <div className="w-20 h-20 rounded-lg bg-surface-container-low overflow-hidden flex-none">
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

            <div className="flex-1 min-w-0 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="font-label-md text-label-md text-on-surface truncate">
                    {line.name}
                  </h2>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    {formatCVE(line.price)} cada
                  </p>
                </div>
                <button
                  onClick={() => remove(line.productId)}
                  aria-label={"Remover " + line.name}
                  className="w-8 h-8 grid place-items-center rounded-full text-on-surface-variant hover:bg-error-container/40 hover:text-error transition-colors flex-none"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    delete
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center bg-surface-container rounded-full p-1 border border-outline-variant/20">
                  <button
                    aria-label="Diminuir quantidade"
                    onClick={() => setQty(line.productId, line.qty - 1)}
                    className="stepper-btn w-8 h-8 grid place-items-center rounded-full bg-surface-container-lowest text-on-surface shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      remove
                    </span>
                  </button>
                  <span className="w-9 text-center font-label-md text-label-md text-primary">
                    {line.qty}
                  </span>
                  <button
                    aria-label="Aumentar quantidade"
                    onClick={() => setQty(line.productId, line.qty + 1)}
                    className="stepper-btn w-8 h-8 grid place-items-center rounded-full bg-primary text-on-primary shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      add
                    </span>
                  </button>
                </div>
                <span className="font-label-md text-label-md text-on-surface">
                  {formatCVE(line.price * line.qty)}
                </span>
              </div>
            </div>
          </div>
        ))}

        <Link
          href="/produtos"
          className="self-center mt-2 flex items-center gap-1 text-primary font-label-md text-label-md px-3 py-2 rounded-lg hover:bg-surface-container-low"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Continuar a comprar
        </Link>
      </main>

      <div className="fixed bottom-0 left-0 w-full z-40 bg-surface-container-highest rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-safe border-t border-outline-variant/20">
        <div className="max-w-3xl mx-auto w-full px-margin-mobile py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Total
            </span>
            <span className="font-headline-md text-headline-md text-primary">
              {formatCVE(total)}
            </span>
          </div>
          <Link
            href="/finalizar"
            className="flex-1 max-w-xs bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim transition-colors py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 card-shadow"
          >
            <span className="font-label-md text-label-md">Finalizar pedido</span>
            <span className="material-symbols-outlined text-[20px]">
              arrow_forward
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
