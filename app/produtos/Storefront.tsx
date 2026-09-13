"use client";

// The full catalog. Category and search come from the URL, so the header's
// category links and search box produce shareable, bookmarkable pages, and the
// browser back button behaves the way people expect.

import { Suspense, useMemo } from "react";
import Link from "next/link";
import ProductCard from "./ProductCard";
import PromoStrip from "../components/PromoStrip";
import ShopHeader from "../components/ShopHeader";
import { useSearchParams } from "next/navigation";
import { PRODUCT_TYPE_LABEL, type Club, type Product } from "@/lib/types";

function Catalog({
  products,
  clubs,
  failed,
}: {
  products: Product[];
  clubs: Club[];
  failed: boolean;
}) {
  const params = useSearchParams();
  const type = params.get("tipo") ?? "all";
  const club = params.get("clube") ?? "";
  const query = (params.get("q") ?? "").trim();

  const shown = useMemo(() => {
    const needle = query.toLowerCase();
    return products.filter((p) => {
      if (type !== "all" && p.type !== type) return false;
      // Club slugs are the shareable identifier; fall back to the id for clubs
      // created before slugs existed, so older links still resolve.
      if (club && p.clubSlug !== club && p.clubId !== club) return false;
      if (!needle) return true;
      return (
        p.name.toLowerCase().includes(needle) ||
        (p.description ?? "").toLowerCase().includes(needle)
      );
    });
  }, [products, type, query, club]);

  // Categories are derived from the catalog, so the menu can never offer a
  // filter that returns nothing.
  const availableTypes = useMemo(
    () => Array.from(new Set(products.map((p) => p.type))),
    [products]
  );

  const activeClub = clubs.find((c) => c.slug === club || c.id === club);
  const heading = activeClub
    ? activeClub.name
    : type === "all"
      ? "Todos os produtos"
      : PRODUCT_TYPE_LABEL[type] ?? "Produtos";

  // Keeps the current type/search while switching club.
  function clubHref(slug: string): string {
    const next = new URLSearchParams();
    if (type !== "all") next.set("tipo", type);
    if (query) next.set("q", query);
    if (slug) next.set("clube", slug);
    const qs = next.toString();
    return "/produtos" + (qs ? "?" + qs : "");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
      <ShopHeader
        initialQuery={query}
        activeType={type}
        availableTypes={availableTypes}
      />

      <main className="flex-1 max-w-5xl mx-auto w-full px-margin-mobile py-6 pb-10 flex flex-col gap-4">
        {clubs.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Link
              href={clubHref("")}
              className={chipCls(!activeClub)}
            >
              Todos os clubes
            </Link>
            {clubs.map((c) => (
              <Link
                key={c.id}
                href={clubHref(c.slug ?? c.id)}
                className={chipCls(activeClub?.id === c.id)}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {query ? 'Resultados para "' + query + '"' : heading}
          </h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {shown.length} {shown.length === 1 ? "produto" : "produtos"}
          </span>
        </div>

        {failed ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-outline">
              cloud_off
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              Não foi possível carregar a loja neste momento. Atualize a página
              dentro de instantes.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <div className="text-center py-16 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-outline">
              search_off
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              {query
                ? "Nenhum produto corresponde à sua procura."
                : "Nenhum produto nesta categoria."}
            </p>
            <Link
              href="/produtos"
              className="text-primary font-label-md text-label-md hover:underline"
            >
              Ver todos os produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>

      <PromoStrip />
    </div>
  );
}

// useSearchParams needs a Suspense boundary for the page to stay static.
export default function Storefront({
  products,
  clubs,
  failed = false,
}: {
  products: Product[];
  clubs: Club[];
  failed?: boolean;
}) {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-surface" />}>
      <Catalog products={products} clubs={clubs} failed={failed} />
    </Suspense>
  );
}

// Pill styling for the club filter row.
function chipCls(active: boolean): string {
  return (
    "px-3 py-1.5 rounded-full font-label-sm text-label-sm whitespace-nowrap transition-colors flex-none " +
    (active
      ? "bg-primary text-on-primary"
      : "bg-surface-container-low text-on-surface-variant hover:bg-surface-container")
  );
}
