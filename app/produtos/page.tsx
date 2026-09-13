import type { Metadata } from "next";
import Storefront from "./Storefront";
import { listClubs } from "@/lib/db/clubs";
import { listProducts } from "@/lib/db/products";
import type { Club, Product } from "@/lib/types";

export const metadata: Metadata = {
  title: "Loja",
  description:
    "Pins, emblemas, cintos e insígnias dos Aventureiros. Escolha os seus produtos e faça a pré-encomenda online.",
  alternates: { canonical: "/produtos" },
};

// Re-read the catalog at most once a minute. Admin edits appear quickly without
// every visitor triggering a database query.
export const revalidate = 60;

export default async function ProdutosPage() {
  // Fetched on the server so the grid is already in the HTML on first paint,
  // which matters on the slow mobile connections most customers are on.
  // listProducts selects the public columns only — supplier cost and packing
  // weight are never part of what reaches the browser.
  let products: Product[] = [];
  let clubs: Club[] = [];
  let failed = false;

  try {
    [products, clubs] = await Promise.all([
      listProducts({ activeOnly: true }),
      listClubs({ activeOnly: true }),
    ]);
  } catch (err) {
    // A database problem must not fail the build or, worse, render as a
    // convincing "we have nothing for sale". Say so honestly instead; the page
    // revalidates within the minute and recovers on its own.
    console.error("[produtos] could not load the catalog", err);
    failed = true;
  }

  return <Storefront products={products} clubs={clubs} failed={failed} />;
}
