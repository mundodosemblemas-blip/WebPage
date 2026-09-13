import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Personal or private screens: the admin area, a customer's own order,
      // and their cart/checkout.
      disallow: ["/admin", "/pedido", "/carrinho", "/finalizar", "/api"],
    },
    sitemap: SITE_URL + "/sitemap.xml",
    host: SITE_URL,
  };
}
