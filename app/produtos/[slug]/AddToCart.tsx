"use client";

// Quantity picker plus the add button on a product detail page. After adding,
// it confirms inline and offers the cart, rather than navigating away and
// interrupting someone who wants to keep browsing.

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { formatCVE, type Product } from "@/lib/types";

export default function AddToCart({ product }: { product: Product }) {
  const { add, qtyOf } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const inCart = qtyOf(product.id);

  function handleAdd() {
    add(product, qty);
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="font-label-md text-label-md text-on-surface-variant">
          Quantidade
        </span>
        <div className="flex items-center bg-surface-container rounded-full p-1 border border-outline-variant/20">
          <button
            aria-label="Diminuir quantidade"
            disabled={qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="stepper-btn w-9 h-9 flex items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-sm disabled:opacity-40 disabled:shadow-none"
          >
            <span className="material-symbols-outlined text-[18px]">remove</span>
          </button>
          <span className="w-10 text-center font-label-md text-label-md text-primary">
            {qty}
          </span>
          <button
            aria-label="Aumentar quantidade"
            onClick={() => setQty((q) => Math.min(999, q + 1))}
            className="stepper-btn w-9 h-9 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="w-full bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim transition-colors py-4 rounded-xl flex items-center justify-center gap-2 font-headline-md text-headline-md active:scale-[0.98] card-shadow"
      >
        <span className="material-symbols-outlined">add_shopping_cart</span>
        Adicionar — {formatCVE(product.price * qty)}
      </button>

      {added && (
        <div className="bg-primary-container text-on-primary-container rounded-xl px-4 py-3 flex items-center gap-2 font-label-md text-label-md">
          <span className="material-symbols-outlined text-[20px]">
            check_circle
          </span>
          <span className="flex-1">
            No carrinho ({inCart} {inCart === 1 ? "unidade" : "unidades"}).
          </span>
          <Link href="/carrinho" className="underline whitespace-nowrap">
            Ver carrinho
          </Link>
        </div>
      )}
    </div>
  );
}
