"use client";

// The shop front. Built to read as a storefront rather than a menu: search and
// cart in the header, a banner, products grouped into category sections, a
// reassurance strip and a footer.

import Link from "next/link";
import PromoStrip from "./components/PromoStrip";
import ShopHeader from "./components/ShopHeader";
import MarketingBand from "./components/MarketingBand";
import { HERO_HEADLINE, HERO_SUBLINE } from "@/lib/marketing";
import ProductCard from "./produtos/ProductCard";
import {
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABEL,
  type Club,
  type Product,
} from "@/lib/types";

const CONTACT_EMAIL = "mundodosemblemas@gmail.com";

// How many club showcases to put on the home page.
const CLUB_SECTIONS = 2;

export default function HomeStore({
  products,
  clubs,
  failed = false,
}: {
  products: Product[];
  clubs: Club[];
  failed?: boolean;
}) {
  // A showcase per club, in the order set in admin. Clubs with no products are
  // skipped so a section is never empty.
  const clubSections = clubs
    .map((c) => ({
      club: c,
      items: products.filter((p) => p.clubId === c.id),
    }))
    .filter((s) => s.items.length > 0)
    .slice(0, CLUB_SECTIONS);

  // Group into sections in the catalog own category order, skipping any
  // category with nothing in it.
  const sections = PRODUCT_TYPES.map((t) => ({
    type: t.value,
    label: t.label,
    items: products.filter((p) => p.type === t.value),
  })).filter((s) => s.items.length > 0);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
      <ShopHeader availableTypes={sections.map((s) => s.type)} />

      <main className="flex-1 w-full pb-12">
        {/* Banner */}
        {/*<section className="bg-primary text-on-primary">
          <div className="max-w-5xl mx-auto w-full px-margin-mobile py-8 sm:py-10 flex items-center gap-5 sm:gap-8">
            <img
              src="/logo.jpeg"
              alt="Mundo de Emblemas — Aventureiros"
              width={160}
              height={160}
              className="w-24 sm:w-36 h-auto rounded-2xl shadow-lg flex-none"
            />
            <div className="min-w-0 flex flex-col gap-2 items-start">
              <h2 className="font-headline-lg text-headline-lg">
                {HERO_HEADLINE}
              </h2>
              <p className="font-body-md text-body-md text-primary-fixed/90">
                {HERO_SUBLINE}
              </p>
              <Link
                href="/produtos"
                className="mt-1 inline-flex items-center gap-2 bg-secondary-container text-on-secondary-container px-5 py-3 rounded-xl font-label-md text-label-md active:scale-95 transition-transform"
              >
                Ver todos os produtos
                <span className="material-symbols-outlined text-[20px]">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>
        </section>*/}

        <MarketingBand />

        {failed ? (
          <div className="max-w-5xl mx-auto w-full px-margin-mobile text-center py-16 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-[40px] text-outline">
              cloud_off
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xs">
              Não foi possível carregar a loja neste momento. Atualize a página
              dentro de instantes.
            </p>
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-on-surface-variant py-16">
            Ainda não há produtos disponíveis.
          </p>
        ) : (
          <>
            {/* Club showcases first: these are the merchandising rows. */}
            {clubSections.map((section) => (
              <section
                key={section.club.id}
                className="max-w-5xl mx-auto w-full px-margin-mobile pt-8 flex flex-col gap-4"
              >
                <div className="flex items-baseline justify-between gap-3 border-b border-outline-variant/40 pb-2">
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    {section.club.name}
                  </h3>
                  <Link
                    href={"/produtos?clube=" + (section.club.slug ?? section.club.id)}
                    className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline flex-none"
                  >
                    Ver todos
                    <span className="material-symbols-outlined text-[18px]">
                      chevron_right
                    </span>
                  </Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                  {section.items.slice(0, 12).map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            ))}

            {sections.map((section) => (
            <section
              key={section.type}
              className="max-w-5xl mx-auto w-full px-margin-mobile pt-8 flex flex-col gap-4"
            >
              <div className="flex items-baseline justify-between gap-3 border-b border-outline-variant/40 pb-2">
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  {PRODUCT_TYPE_LABEL[section.type] ?? section.type}
                </h3>
                <Link
                  href={"/produtos?tipo=" + section.type}
                  className="flex items-center gap-1 text-primary font-label-md text-label-md hover:underline flex-none"
                >
                  Ver todos
                  <span className="material-symbols-outlined text-[18px]">
                    chevron_right
                  </span>
                </Link>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
                {section.items.slice(0, 12).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
            ))}
          </>
        )}

        <div className="mt-12">
          <PromoStrip />
        </div>

        {/* Existing order */}
        <section className="max-w-5xl mx-auto w-full px-margin-mobile pt-8">
          <Link
            href="/pedido"
            className="group flex items-center gap-4 bg-surface-container-lowest rounded-xl card-shadow p-4 border border-outline-variant/20 hover:bg-surface-bright transition-colors"
          >
            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container grid place-items-center flex-none">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-label-md text-label-md text-on-surface">
                Já fez um pedido?
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Consulte ou altere o seu pedido com o e-mail ou telefone.
              </p>
            </div>
            <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
              chevron_right
            </span>
          </Link>
        </section>

        <footer className="max-w-5xl mx-auto w-full px-margin-mobile pt-10 text-center flex flex-col gap-1">
          <a
            href={"mailto:" + CONTACT_EMAIL}
            className="font-label-sm text-label-sm text-primary hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          <p className="font-label-sm text-label-sm text-outline">
            © 2026 Mundo de Emblemas. Todos os direitos reservados.
          </p>
        </footer>
      </main>
    </div>
  );
}
