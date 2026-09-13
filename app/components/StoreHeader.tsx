"use client";

// Storefront header: brand, optional back button, and the cart badge.
// Shown on every shopping screen so the cart is always one tap away.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";

export default function StoreHeader({
  title,
  subtitle,
  back,
  showCart = true,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  showCart?: boolean;
}) {
  const router = useRouter();
  const { count, ready } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/60 shadow-sm">
      <div className="max-w-5xl mx-auto w-full px-margin-mobile py-3 flex items-center gap-3">
        {back ? (
          <button
            onClick={() => router.back()}
            aria-label="Voltar"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-background text-on-surface hover:bg-surface-container-low transition-colors active:scale-95 flex-none"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <Link
            href="/"
            aria-label="Início"
            className="w-9 h-9 rounded-lg overflow-hidden flex-none"
          >
            <img
              src="/logo.jpeg"
              alt="Mundo de Emblemas"
              className="w-full h-full object-cover"
            />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="font-headline-md text-headline-md text-on-surface leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {subtitle}
            </p>
          )}
        </div>

        {showCart && (
          <Link
            href="/carrinho"
            aria-label={"Carrinho, " + count + " itens"}
            className="relative w-10 h-10 grid place-items-center rounded-full bg-surface-container-low hover:bg-surface-container transition-colors flex-none"
          >
            <span className="material-symbols-outlined text-on-surface">
              shopping_cart
            </span>
            {/* Hidden until the cart has loaded, so the badge never flashes 0. */}
            {ready && count > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 px-1 rounded-full bg-tertiary-container text-on-tertiary-container grid place-items-center font-label-sm text-[11px] leading-none">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
