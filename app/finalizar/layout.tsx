import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finalizar pedido",
  description: "Confirme os seus dados de contacto e envie a sua encomenda.",
  robots: { index: false, follow: true },
};

export default function FinalizarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
