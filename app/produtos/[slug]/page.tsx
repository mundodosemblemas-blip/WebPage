import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "./AddToCart";
import StoreHeader from "../../components/StoreHeader";
import { findProduct, listProducts } from "@/lib/db/products";
import {
  FALLBACK_IMAGE,
  PRODUCT_TYPE_BADGE,
  PRODUCT_TYPE_LABEL,
  formatCVE,
  productHref,
} from "@/lib/types";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

// The slug segment also accepts a product id, so links to products created
// before slugs existed keep working.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: "Produto não encontrado" };

  const description =
    product.description ??
    (PRODUCT_TYPE_LABEL[product.type] ?? product.type) +
      " dos Aventureiros — " +
      formatCVE(product.price) +
      ". Faça a sua pré-encomenda online.";

  return {
    title: product.name,
    description,
    alternates: { canonical: productHref(product) },
    openGraph: {
      title: product.name,
      description,
      images: product.image ? [{ url: product.image }] : undefined,
    },
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;
  const product = await findProduct(slug);

  // A hidden product should not be reachable by URL either.
  if (!product || !product.active) notFound();

  // A few other items to keep browsing, preferring the same category.
  const all = await listProducts({ activeOnly: true });
  const related = all
    .filter((p) => p.id !== product.id)
    .sort((a, b) => Number(b.type === product.type) - Number(a.type === product.type))
    .slice(0, 4);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
      <StoreHeader title={product.name} back />

      <main className="flex-1 max-w-3xl mx-auto w-full px-margin-mobile py-6 flex flex-col gap-6">
        <div className="rounded-xl overflow-hidden bg-surface-container-low card-shadow">
          <img
            src={product.image || FALLBACK_IMAGE}
            alt={product.name}
            className="w-full aspect-square object-cover"
          />
        </div>

        <div className="flex flex-col gap-3">
          <span
            className={
              "self-start px-2.5 py-1 rounded-full font-label-sm text-[11px] tracking-wide uppercase " +
              (PRODUCT_TYPE_BADGE[product.type] ??
                "bg-surface-container-high text-on-surface")
            }
          >
            {PRODUCT_TYPE_LABEL[product.type] ?? product.type}
          </span>

          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            {product.name}
          </h2>
          <p className="font-headline-md text-headline-md text-primary">
            {formatCVE(product.price)}
          </p>

          {product.description && (
            <p className="font-body-md text-body-md text-on-surface-variant whitespace-pre-line">
              {product.description}
            </p>
          )}

          {/* Specs. Each row only appears when that field is filled in. */}
          {(product.size || product.finish || product.clubName) && (
            <dl className="mt-1 flex flex-col gap-1.5 bg-surface-container-low rounded-xl p-3">
              {product.clubName && (
                <Spec label="Clube" value={product.clubName} />
              )}
              {product.size && <Spec label="Tamanho" value={product.size} />}
              {product.finish && (
                <Spec label="Acabamento" value={product.finish} />
              )}
            </dl>
          )}
        </div>

        <AddToCart product={product} />

        <p className="font-label-sm text-label-sm text-on-surface-variant text-center">
          Pré-encomenda. O pagamento é combinado connosco depois de
          confirmarmos o seu pedido.
        </p>

        {related.length > 0 && (
          <section className="mt-4 flex flex-col gap-3">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
              Também pode gostar
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={productHref(p)}
                  className="bg-surface-container-lowest rounded-lg card-shadow overflow-hidden border border-outline-variant/20"
                >
                  <img
                    src={p.image || FALLBACK_IMAGE}
                    alt={p.name}
                    loading="lazy"
                    className="w-full aspect-square object-cover"
                  />
                  <div className="p-2 flex flex-col gap-0.5">
                    <div className="font-label-sm text-label-sm text-on-surface truncate">
                      {p.name}
                    </div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant">
                      {formatCVE(p.price)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// One row of the product spec list.
function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 font-body-md text-body-md">
      <dt className="text-on-surface-variant w-28 flex-none">{label}</dt>
      <dd className="text-on-surface min-w-0">{value}</dd>
    </div>
  );
}
