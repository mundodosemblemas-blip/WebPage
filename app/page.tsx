import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-surface text-on-surface">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-20%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <main className="w-full max-w-md px-margin-mobile flex flex-col items-center justify-center z-10 relative">
        {/* Hero header */}
        <header className="text-center mb-12 flex flex-col items-center">
          <div className="w-24 h-24 mb-6 rounded-full bg-surface-container-highest shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/20"></div>
            <span className="material-symbols-outlined text-4xl text-on-primary fill-icon z-10 drop-shadow-md">
              explore
            </span>
          </div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-primary mb-2">
            Mundo de Emblemas 🇨🇻
          </h1>
          <h2 className="font-headline-md text-headline-md text-on-surface-variant">
            Aventureiros
          </h2>
        </header>

        {/* Action buttons */}
        <div className="w-full flex flex-col gap-4">
          {/* Primary: new order */}
          <Link
            href="/novo"
            className="w-full relative overflow-hidden group bg-primary text-on-primary rounded-xl p-6 shadow-[0_8px_16px_rgba(94,0,129,0.2)] flex items-center justify-between transition-transform duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary-container to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex flex-col items-start text-left">
              <span className="font-headline-md text-headline-md mb-1">
                Fazer Novo Pedido
              </span>
              <span className="font-body-md text-body-md text-primary-fixed opacity-90">
                Iniciar uma nova jornada de pins.
              </span>
            </div>
            <div className="relative z-10 w-12 h-12 rounded-full bg-on-primary/20 flex items-center justify-center backdrop-blur-sm">
              <span className="material-symbols-outlined text-3xl">
                add_shopping_cart
              </span>
            </div>
          </Link>

          {/* Secondary: edit order */}
          <Link
            href="/editar"
            className="w-full relative overflow-hidden group bg-surface-container-lowest text-primary border border-outline-variant rounded-xl p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)] flex items-center justify-between transition-transform duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface hover:bg-surface-bright"
          >
            <div className="relative z-10 flex flex-col items-start text-left">
              <span className="font-headline-md text-headline-md mb-1">
                Editar Pedido Existente
              </span>
              <span className="font-body-md text-body-md text-on-surface-variant">
                Ajustar quantidades ou itens.
              </span>
            </div>
            <div className="relative z-10 w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              <span className="material-symbols-outlined text-2xl">
                edit_note
              </span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="font-label-sm text-label-sm text-outline">
            Gestão de Pins para Clubes Regionais
          </p>
          <p className="font-label-sm text-label-sm text-outline mt-5">
            © 2026 Mundo de Emblemas. Todos os direitos reservados.
          </p>
          <p className="font-label-sm text-label-sm text-outline">
            Contato: mundodosemblemas@gmail.com
          </p>
        </div>
      </main>
    </div>
  );
}
