import HomeStore from "./HomeStore";
import { listClubs } from "@/lib/db/clubs";
import { listProducts } from "@/lib/db/products";
import type { Club, Product } from "@/lib/types";

// Same cadence as the catalog: admin edits appear within the minute without
// every visitor hitting the database.
export const revalidate = 60;

export default async function HomePage() {
  let products: Product[] = [];
  let clubs: Club[] = [];
  let failed = false;

  try {
    [products, clubs] = await Promise.all([
      listProducts({ activeOnly: true }),
      listClubs({ activeOnly: true }),
    ]);
  } catch (err) {
    // Never let a database problem fail the build or masquerade as an empty
    // shop — say so plainly and recover on the next revalidation.
    console.error("[home] could not load the catalog", err);
    failed = true;
  }

  return <HomeStore products={products} clubs={clubs} failed={failed} />;
}
