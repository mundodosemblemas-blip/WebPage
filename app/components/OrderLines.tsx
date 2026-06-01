"use client";

import { PIN_MAP, FALLBACK_IMAGE, formatBRL } from "@/lib/pins";
import type { Cart } from "./CatalogEditor";

// Read-only itemized list of a cart, used on the confirmation screen.
export default function OrderLines({ cart }: { cart: Cart }) {
  const entries = Object.entries(cart).filter(([, qty]) => qty > 0);
  return (
    <div>
      {entries.map(([pinId, qty]) => {
        const pin = PIN_MAP[pinId];
        if (!pin) return null;
        return (
          <div key={pinId} className="summary-line">
            <img
              src={pin.image}
              alt={pin.name}
              onError={(e) => {
                if (e.currentTarget.src !== FALLBACK_IMAGE)
                  e.currentTarget.src = FALLBACK_IMAGE;
              }}
            />
            <div>
              <div className="ln-name">{pin.name}</div>
              <div className="ln-sub">
                {qty} × {formatBRL(pin.price)}
              </div>
            </div>
            <div className="ln-total">{formatBRL(pin.price * qty)}</div>
          </div>
        );
      })}
    </div>
  );
}
