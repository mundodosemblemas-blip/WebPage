// Central site constants used by metadata, robots, and sitemap. Override the
// URL per environment with NEXT_PUBLIC_SITE_URL (no trailing slash needed).

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://web-page-two-green.vercel.app"
).replace(/\/+$/, "");

export const SITE_NAME = "Mundo de Emblemas";

export const SITE_DESCRIPTION =
  "A primeira loja online de materiais de Desbravadores e Aventureiros em Cabo Verde. " +
  "Pins, emblemas, cintos e insígnias: faça a sua encomenda e receba na sua ilha, " +
  "sem esperar anos por encomendas de fora.";

// Default social-share image: the brand logo (1254×1254, served from /public).
export const SITE_OG_IMAGE = "/logo.jpeg";
export const SITE_OG_IMAGE_SIZE = 1254;
