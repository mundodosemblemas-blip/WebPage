// Central site constants used by metadata, robots, and sitemap. Override the
// URL per environment with NEXT_PUBLIC_SITE_URL (no trailing slash needed).

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-page-two-green.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Mundo de Emblemas";

export const SITE_DESCRIPTION =
  "Pré-encomenda de pins e emblemas dos Aventureiros para clubes de Cabo Verde. " +
  "Faça e acompanhe o seu pedido online de forma simples.";

// Default social-share image: the brand logo (1254×1254, served from /public).
export const SITE_OG_IMAGE = "/logo.jpeg";
export const SITE_OG_IMAGE_SIZE = 1254;
