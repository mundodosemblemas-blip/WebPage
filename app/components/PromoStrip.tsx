// Reassurance strip, the way commercial storefronts run one above the footer.
// Every claim here is one the site actually keeps — no invented guarantees.

const PROMISES = [
  {
    icon: "edit_calendar",
    title: "Altere até confirmarmos",
    text: "O seu pedido fica aberto para mudanças enquanto não for confirmado.",
  },
  {
    icon: "mail",
    title: "Confirmação por e-mail",
    text: "Recebe o resumo do pedido e um link direto para o consultar.",
  },
  {
    icon: "sailing",
    title: "Receba na sua ilha",
    text: "Produção nacional para clubes de todo o Cabo Verde.",
  },
];

export default function PromoStrip() {
  return (
    <section className="bg-surface-container-low border-y border-outline-variant/30">
      <div className="max-w-5xl mx-auto w-full px-margin-mobile py-6 grid grid-cols-1 sm:grid-cols-3 gap-5">
        {PROMISES.map((p) => (
          <div key={p.icon} className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container grid place-items-center flex-none">
              <span className="material-symbols-outlined text-[20px]">
                {p.icon}
              </span>
            </span>
            <div className="min-w-0">
              <h3 className="font-label-md text-label-md text-on-surface">
                {p.title}
              </h3>
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                {p.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
