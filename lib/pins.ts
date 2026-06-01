// Pin catalog. Each `image` points to a file in `public/`, which Next.js serves
// from the site root (e.g. public/passarinhos.jpg -> /passarinhos.jpg).
// To change a pin's photo, drop the file in public/ and update its `image` path.
// Until a file exists, FALLBACK_IMAGE is shown instead of a broken image.

export interface Pin {
  id: string;
  name: string;
  category: string;
  price: number; // in BRL
  image: string; // path under /public (e.g. "/passarinhos.jpg")
}

// Generic placeholder shown when a pin's image file is missing.
export const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(
  `
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#eeeef0"/>
  <circle cx="200" cy="180" r="110" fill="#d2c1d3"/>
  <circle cx="200" cy="180" r="110" fill="none" stroke="#807382" stroke-width="3" stroke-dasharray="6 10"/>
  <rect x="175" y="290" width="50" height="64" rx="6" fill="#b9a9ba"/>
  <text x="200" y="188" font-family="Arial, sans-serif" font-size="28" font-weight="700"
        fill="#5e0081" text-anchor="middle" dominant-baseline="middle">PIN</text>
</svg>`.trim()
)}`;

export const PINS: Pin[] = [
  { id: "p01", name: "Passarinhos", category: "Unidades", price: 230, image: "/passarinhos.jpg" },
  { id: "p02", name: "Ovelhinha", category: "Unidades", price: 230, image: "/ovelhinha.jpg" },
  { id: "p03", name: "Edificadores", category: "Unidades", price: 230, image: "/edificadores.png" },
  { id: "p04", name: "Luminares", category: "Unidades", price: 230, image: "/luminares.png" },
  { id: "p05", name: "Mãos ajudadores", category: "Unidades", price: 230, image: "/maos-ajudadoras.png" },
  { id: "p06", name: "Abelinhas", category: "Unidades", price: 230, image: "/abelhinhas-laboriosas.png" },
];

export const PIN_MAP: Record<string, Pin> = Object.fromEntries(
  PINS.map((p) => [p.id, p])
);

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
