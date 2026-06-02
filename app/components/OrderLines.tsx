"use client";

import { FALLBACK_IMAGE, formatCVE, type Product } from "@/lib/products";
import type { OrderItem } from "@/lib/storage";

// Read-only itemized list of an order. Renders from the stored snapshot
// (name + price); if a `products` map is provided it is used to show the
// product image (orders don't store the image).
export default function OrderLines({
  items,
  products,
}: {
  items: OrderItem[];
  products?: Record<string, Product>;
}) {
  return (
    <div>
      {items.map((it) => {
        const product = products?.[it.pinId];
        const name = it.name ?? product?.name ?? it.pinId;
        const price = it.price ?? product?.price ?? 0;
        const image = product?.image || FALLBACK_IMAGE;
        return (
          <div key={it.pinId} className="summary-line">
            <img
              src={image}
              alt={name}
              onError={(e) => {
                if (e.currentTarget.src !== FALLBACK_IMAGE)
                  e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <div>
              <div className="ln-name">{name}</div>
              <div className="ln-sub">
                {it.qty} × {formatCVE(price)}
              </div>
            </div>
            <div className="ln-total">{formatCVE(price * it.qty)}</div>
          </div>
        );
      })}
    </div>
  );
}
