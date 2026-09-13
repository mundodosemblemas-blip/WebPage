// All storefront marketing copy lives here so the wording can change without
// touching layout code.
//
// To add another rotating message, append to MARKETING_MESSAGES below. The
// band on the home page slides through them automatically; anything from one
// message upwards works (with a single message it simply sits still).

export const TAGLINE =
  "A primeira loja online de materiais de Desbravadores e Aventureiros em Cabo Verde";

export const HERO_HEADLINE = "A sua loja de pins nacional";

export const HERO_SUBLINE =
  "Chega de esperar anos por pins e emblemas. Faça a sua encomenda e receba na sua ilha.";

export interface MarketingMessage {
  /** Material Symbols icon name, e.g. "flag". */
  icon: string;
  title: string;
  text: string;
}

export const MARKETING_MESSAGES: MarketingMessage[] = [
  {
    icon: "flag",
    title: "Chega de esperar anos por pins e emblemas",
    text: "Investimos em Cabo Verde para que os clubes deixem de depender de encomendas de fora.",
  },
  {
    icon: "storefront",
    title: "A primeira loja caboverdeana para Aventureiros e Desbravadores",
    text: "Materiais de Desbravadores e Aventureiros, pensados para os clubes cabo-verdianos.",
  },
  {
    icon: "sailing",
    title: "Receba na sua ilha",
    text: "Faça a encomenda online e receba onde estiver, sem intermediários.",
  },
  {
    icon: "edit_calendar",
    title: "Mude o pedido quando precisar",
    text: "O seu pedido fica aberto a alterações até nós o confirmarmos.",
  },
];
