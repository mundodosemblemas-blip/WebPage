"use client";

// The shopping cart: a client-side context persisted to localStorage so it
// survives navigation between the storefront, a product page and checkout, and
// survives a refresh.
//
// Each line keeps a snapshot of the name, price and image at the time it was
// added, so the cart and checkout screens render without refetching the
// catalog. Those values are for display only — the server re-resolves every
// price from the database when the order is placed.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Product } from "./types";

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  slug: string | null;
  qty: number;
}

interface CartValue {
  lines: CartLine[];
  /** False until localStorage has been read, so the UI can avoid flashing an
   *  empty cart on first paint. */
  ready: boolean;
  count: number;
  total: number;
  qtyOf: (productId: string) => number;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "mde_cart_v1";

const CartContext = createContext<CartValue | null>(null);

function readStored(): CartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Drop anything that does not look like a line, so an old or hand-edited
    // localStorage value cannot crash the app.
    return parsed.filter(
      (l): l is CartLine =>
        l && typeof l.productId === "string" && Number(l.qty) > 0
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  // Load once on mount. Reading localStorage during render would break SSR
  // hydration, so the cart starts empty and fills in immediately after.
  useEffect(() => {
    setLines(readStored());
    setReady(true);
  }, []);

  // Persist on every change, but not before the initial load — otherwise the
  // empty starting state would overwrite a saved cart.
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // Private mode or a full quota: the cart still works for this session.
    }
  }, [lines, ready]);

  const add = useCallback((product: Product, qty = 1) => {
    if (qty <= 0) return;
    setLines((current) => {
      const existing = current.find((l) => l.productId === product.id);
      if (existing) {
        return current.map((l) =>
          l.productId === product.id ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
          slug: product.slug,
          qty,
        },
      ];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((current) =>
      qty <= 0
        ? current.filter((l) => l.productId !== productId)
        : current.map((l) => (l.productId === productId ? { ...l, qty } : l))
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((current) => current.filter((l) => l.productId !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartValue>(() => {
    const count = lines.reduce((sum, l) => sum + l.qty, 0);
    const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);
    return {
      lines,
      ready,
      count,
      total,
      qtyOf: (productId) =>
        lines.find((l) => l.productId === productId)?.qty ?? 0,
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, ready, add, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside a CartProvider.");
  return ctx;
}
