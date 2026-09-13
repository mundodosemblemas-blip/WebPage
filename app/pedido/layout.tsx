import type { Metadata } from "next";

// A personal order-lookup utility: useful to customers, not a search landing
// page, so keep it out of the index.
export const metadata: Metadata = {
  title: "O meu pedido",
  description: "Consulte ou altere um pedido pelo e-mail ou telefone.",
  robots: { index: false, follow: true },
};

export default function PedidoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
