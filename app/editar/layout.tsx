import type { Metadata } from "next";

// Personal order-lookup utility — useful to users but not a search landing
// page, so keep it out of the index.
export const metadata: Metadata = {
  title: "Editar pedido",
  description: "Localize e atualize um pedido existente pelo e-mail ou telefone.",
  robots: { index: false, follow: true },
};

export default function EditarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
