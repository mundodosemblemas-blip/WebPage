"use client";

// One product in the storefront grid. Deliberately compact so more items fit
// per row: image, name, price, add button. The category badge lives on the
// product page instead — at this size it was noise, and the header's category
// nav already covers browsing by type.

import Link from "next/link";
import {
  FALLBACK_IMAGE,
  formatCVE,
  productHref,
  type Product,
} from "@/lib/types";
import { useCart } from "@/lib/cart";

export default function ProductCard({ product }: { product: Product }) {
  const { add, qtyOf } = useCart();
  const inCart = qtyOf(product.id);

  return (
    <article className="group relative bg-surface-container-lowest rounded-lg card-shadow overflow-hidden flex flex-col border border-outline-variant/20 transition-shadow hover:shadow-md">
      <Link href={productHref(product)} className="flex flex-col flex-1">
        <div className="aspect-square bg-surface-container-low overflow-hidden">
          <img
            src={product.image || FALLBACK_IMAGE}
            alt={product.name}
            loading="lazy"
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_IMAGE)
                e.currentTarget.src = FALLBACK_IMAGE;
            }}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="px-2 pt-2 flex flex-col gap-0.5 flex-1">
          <h2 className="font-label-md text-label-md text-on-surface leading-snug line-clamp-2">
            {product.name}
          </h2>
          <span className="font-label-md text-label-md text-primary mt-auto">
            {formatCVE(product.price)}
          </span>
        </div>
      </Link>

      <div className="p-2 pt-1.5">
        <button
          onClick={() => add(product)}
          aria-label={"Adicionar " + product.name + " ao carrinho"}
          className="w-full flex items-center justify-center gap-1 bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim transition-colors py-1.5 rounded-lg font-label-sm text-label-sm active:scale-95"
        >
          <span className="material-symbols-outlined text-[15px]">
            {inCart > 0 ? "check" : "add_shopping_cart"}
          </span>
          {inCart > 0 ? inCart : "Juntar"}
        </button>
      </div>
    </article>
  );
}
