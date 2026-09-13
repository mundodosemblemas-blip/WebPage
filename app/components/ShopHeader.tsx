"use client";

// The commercial storefront header, used on the home page and the catalog:
// a contact strip, the brand, a search box, the cart with its running total,
// and the category nav underneath.
//
// The compact StoreHeader is still used on the cart, checkout and order screens,
// where search and category links would only be noise.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { PRODUCT_TYPES, formatCVE } from "@/lib/types";
import { TAGLINE } from "@/lib/marketing";

const CONTACT_EMAIL = "mundodosemblemas@gmail.com";

export default function ShopHeader({
  initialQuery = "",
  activeType = "all",
  availableTypes,
}: {
  initialQuery?: string;
  activeType?: string;
  /** Types that actually have products. Omit to show the full list. */
  availableTypes?: string[];
}) {
  const router = useRouter();
  const { count, total, ready } = useCart();
  const [query, setQuery] = useState(initialQuery);

  function search(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push("/produtos" + (q ? "?q=" + encodeURIComponent(q) : ""));
  }

  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest shadow-sm">
      {/* Contact strip */}
      <div className="bg-primary text-on-primary">
        <div className="max-w-5xl mx-auto w-full px-margin-mobile py-1.5 flex items-center justify-between gap-3">
          <p className="font-label-sm text-label-sm truncate">{TAGLINE}</p>
          <a
            href={"mailto:" + CONTACT_EMAIL}
            className="flex items-center gap-1 font-label-sm text-label-sm hover:underline flex-none"
          >
            <span className="material-symbols-outlined text-[16px]">mail</span>
            <span className="hidden sm:inline">{CONTACT_EMAIL}</span>
          </a>
        </div>
      </div>

      {/* Brand + search + cart */}
      <div className="max-w-5xl mx-auto w-full px-margin-mobile py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 flex-none">
          <img
            src="/logo.jpeg"
            alt="Mundo de Emblemas"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <span className="hidden sm:block font-headline-md text-headline-md text-primary leading-tight">
            Mundo de Emblemas
          </span>
        </Link>

        <form onSubmit={search} className="flex-1 min-w-0 relative">
          <span
            className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
            style={{ fontSize: 20 }}
          >
            search
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar produtos…"
            aria-label="Procurar produtos"
            className="w-full bg-surface-container-low border border-outline-variant/40 focus:border-primary rounded-full pl-10 pr-3 py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors placeholder:text-outline/70"
          />
        </form>

        <Link
          href="/carrinho"
          aria-label={"Carrinho, " + count + " itens"}
          className="flex items-center gap-2 flex-none rounded-full bg-surface-container-low hover:bg-surface-container transition-colors px-3 py-2"
        >
          <span className="relative grid place-items-center">
            <span className="material-symbols-outlined text-on-surface">
              shopping_cart
            </span>
            {ready && count > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-tertiary-container text-on-tertiary-container grid place-items-center font-label-sm text-[10px] leading-none">
                {count > 99 ? "99+" : count}
              </span>
            )}
          </span>
          <span className="hidden sm:block font-label-sm text-label-sm text-on-surface whitespace-nowrap">
            {formatCVE(ready ? total : 0)}
          </span>
        </Link>
      </div>

      {/* Category nav */}
      <nav className="border-t border-outline-variant/30 bg-surface-container-lowest">
        <div className="max-w-5xl mx-auto w-full px-margin-mobile flex gap-1 overflow-x-auto">
          {[
            { value: "all", label: "Todos" },
            // Only offer a category if something is actually in it — an empty
            // category is a dead end for the customer.
            ...PRODUCT_TYPES.filter(
              (t) => !availableTypes || availableTypes.includes(t.value)
            ),
          ].map((t) => (
            <Link
              key={t.value}
              href={t.value === "all" ? "/produtos" : "/produtos?tipo=" + t.value}
              className={
                "px-3 py-2.5 font-label-md text-label-md whitespace-nowrap border-b-2 -mb-px transition-colors " +
                (activeType === t.value
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface")
              }
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
