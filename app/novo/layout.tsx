import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fazer novo pedido",
  description:
    "Monte o seu pedido de pins e emblemas dos Aventureiros e confirme em poucos passos.",
  alternates: { canonical: "/novo" },
};

export default function NovoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
