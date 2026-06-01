"use client";

import { PINS, FALLBACK_IMAGE, formatBRL } from "@/lib/pins";

export type Cart = Record<string, number>; // pinId -> qty

// Badge color per category (Material 3 container tokens). Falls back to amber.
const BADGE_CLASS: Record<string, string> = {
  Unidades: "bg-secondary-container text-on-secondary-container",
  Conquistas: "bg-tertiary-container text-on-tertiary",
  Especiais: "bg-primary-container text-on-primary-container",
};

export default function CatalogEditor({
  cart,
  onChange,
}: {
  cart: Cart;
  onChange: (next: Cart) => void;
}) {
  function setQty(pinId: string, qty: number) {
    const next = { ...cart };
    if (qty <= 0) delete next[pinId];
    else next[pinId] = qty;
    onChange(next);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {PINS.map((pin) => {
        const qty = cart[pin.id] ?? 0;
        const badge =
          BADGE_CLASS[pin.category] ??
          "bg-secondary-container text-on-secondary-container";
        return (
          <article
            key={pin.id}
            className="bg-surface-container-lowest rounded-xl card-shadow p-3 flex gap-4 items-center transition-all duration-300 border border-transparent"
          >
            <div className="w-24 h-24 rounded-lg bg-surface-container-low flex-shrink-0 relative overflow-hidden">
              <img
                src={pin.image}
                alt={pin.name}
                loading="lazy"
                onError={(e) => {
                  if (e.currentTarget.src !== FALLBACK_IMAGE)
                    e.currentTarget.src = FALLBACK_IMAGE;
                }}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between py-1 min-w-0">
              <div>
                <h2 className="font-label-md text-label-md text-on-surface">
                  {pin.name}
                </h2>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide uppercase ${badge}`}
                >
                  {pin.category}
                </span>
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="font-body-md text-body-md text-on-surface-variant">
                  {formatBRL(pin.price)}
                </span>
                <div className="flex items-center bg-surface-container rounded-full p-1 border border-outline-variant/20">
                  <button
                    aria-label="Diminuir quantidade"
                    disabled={qty <= 0}
                    onClick={() => setQty(pin.id, qty - 1)}
                    className="stepper-btn w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-lowest text-on-surface shadow-sm transition-transform disabled:opacity-50 disabled:shadow-none"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      remove
                    </span>
                  </button>
                  <span className="w-8 text-center font-label-md text-label-md text-primary">
                    {qty}
                  </span>
                  <button
                    aria-label="Aumentar quantidade"
                    onClick={() => setQty(pin.id, qty + 1)}
                    className="stepper-btn w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary shadow-sm transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      add
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
