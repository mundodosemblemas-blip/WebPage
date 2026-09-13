import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/db/products";
import { SITE_URL } from "@/lib/site";
import { productHref } from "@/lib/types";

// Every product now has its own page, so each one belongs in the sitemap.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL + "/", lastModified: now, changeFrequency: "monthly", priority: 1 },
    {
      url: SITE_URL + "/produtos",
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  try {
    const products = await listProducts({ activeOnly: true });
    return [
      ...staticPages,
      ...products.map((p) => ({
        url: SITE_URL + productHref(p),
        lastModified: new Date(p.updatedAt),
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ];
  } catch (err) {
    // A database hiccup should degrade the sitemap, not fail the build.
    console.error("[sitemap] could not list products", err);
    return staticPages;
  }
}
