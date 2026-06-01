"use client";

import { useRouter } from "next/navigation";

export default function Header({
  title,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
}) {
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/60 shadow-sm">
      <div className="max-w-2xl mx-auto w-full px-margin-mobile py-3 flex items-center gap-3">
        {back ? (
          <button
            className="w-9 h-9 flex items-center justify-center rounded-full bg-background text-on-surface hover:bg-surface-container-low transition-colors active:scale-95"
            aria-label="Voltar"
            onClick={() => router.back()}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        ) : (
          <div className="w-9 h-9 rounded-lg bg-primary text-on-primary grid place-items-center font-extrabold text-lg flex-none">
            A
          </div>
        )}
        <div className="min-w-0">
          <h1 className="font-headline-md text-headline-md text-on-surface leading-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="font-label-sm text-label-sm text-on-surface-variant truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </header>
  );
}
