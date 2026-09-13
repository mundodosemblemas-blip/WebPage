import type { Metadata } from "next";

// A personal, per-visitor page: useful to the customer, pointless in search.
export const metadata: Metadata = {
  title: "Carrinho",
  description: "Os produtos que escolheu, antes de finalizar a encomenda.",
  robots: { index: false, follow: true },
};

export default function CarrinhoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
