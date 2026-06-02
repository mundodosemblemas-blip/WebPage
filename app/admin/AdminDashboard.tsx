"use client";

import Link from "next/link";
import { useState } from "react";
import OrdersPanel from "./OrdersPanel";
import ProductsPanel from "./ProductsPanel";

type Tab = "orders" | "products";

export default function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("orders");

  function logout() {
    sessionStorage.removeItem("mde_admin_ok");
    window.location.reload();
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-on-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface-container-lowest border-b border-outline-variant/60 shadow-sm">
        <div className="max-w-3xl mx-auto w-full px-margin-mobile py-3 flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 grid place-items-center rounded-lg bg-primary text-on-primary font-extrabold text-lg flex-none"
          >
            A
          </Link>
          <h1 className="font-headline-md text-headline-md text-on-surface flex-1">
            Administração
          </h1>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-label-sm text-label-sm px-2 py-1 rounded-lg hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            Sair
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto w-full px-margin-mobile flex gap-1">
          {(
            [
              { id: "orders", label: "Pedidos", icon: "receipt_long" },
              { id: "products", label: "Produtos", icon: "inventory_2" },
            ] as { id: Tab; label: string; icon: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 font-label-md text-label-md border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-on-surface-variant hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="flex-1 px-margin-mobile py-6 max-w-3xl mx-auto w-full">
        {tab === "orders" ? <OrdersPanel /> : <ProductsPanel />}
      </main>
    </div>
  );
}
