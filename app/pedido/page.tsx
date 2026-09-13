"use client";

// Find my order: look up by email or phone, then open one.
//
// The lookup returns a per-order token; opening an order carries that token in
// the URL, so knowing an order code alone is never enough to read or change it.

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import StoreHeader from "../components/StoreHeader";
import { CV_PHONE_PLACEHOLDER } from "@/lib/phone";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  formatCVE,
  orderCount,
  orderTotal,
  type Order,
} from "@/lib/types";

type Result = { order: Order; token: string | null };

function LookupScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const lookup = useCallback(
    async (lookupEmail: string, lookupPhone: string) => {
      if (!lookupEmail.trim() && !lookupPhone.trim()) return;
      setBusy(true);
      setError("");
      try {
        const res = await fetch("/api/orders/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: lookupEmail, phone: lookupPhone }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Não foi possível buscar o pedido.");
          return;
        }
        const found: Result[] = data.results ?? [];
        setResults(found);
        // Exactly one match: skip the picker and open it.
        if (found.length === 1 && found[0].token) {
          router.push(
            "/pedido/" + found[0].order.code + "?token=" + found[0].token
          );
        }
      } catch {
        setError("Falha de ligação. Tente novamente.");
      } finally {
        setBusy(false);
      }
    },
    [router]
  );

  // Arriving from checkout with the contact pre-filled: look it up straight away.
  useEffect(() => {
    const e = searchParams.get("email") ?? "";
    const p = searchParams.get("phone") ?? "";
    if (e || p) {
      setEmail(e);
      setPhone(p);
      setNotice("Já tem um pedido à espera de confirmação. Pode alterá-lo aqui.");
      lookup(e, p);
    }
  }, [searchParams, lookup]);

  const inputCls =
    "w-full bg-surface-container-low border-b-2 border-b-outline-variant focus:border-b-primary text-on-surface font-body-md text-body-md px-3 py-3 rounded-t-md outline-none transition-colors";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
      <StoreHeader title="O meu pedido" back showCart={false} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-margin-mobile py-6 flex flex-col gap-4">
        {notice && (
          <div className="bg-primary-container text-on-primary-container rounded-xl px-4 py-3 font-label-md text-label-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">info</span>
            {notice}
          </div>
        )}

        <div className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-4">
          <p className="font-body-md text-body-md text-on-surface-variant">
            Escreva o e-mail <strong>ou</strong> o telefone que usou no pedido.
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@exemplo.com"
              className={inputCls}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md" htmlFor="phone">
              Telefone
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={CV_PHONE_PLACEHOLDER}
              className={inputCls}
            />
          </div>

          {error && (
            <p className="text-error font-label-sm text-label-sm">{error}</p>
          )}

          <button
            onClick={() => lookup(email, phone)}
            disabled={busy || (!email.trim() && !phone.trim())}
            className="w-full bg-primary text-on-primary py-3.5 rounded-xl font-label-md text-label-md disabled:opacity-50 active:scale-95 transition-transform"
          >
            {busy ? "A procurar…" : "Procurar pedido"}
          </button>
        </div>

        {results !== null && results.length === 0 && (
          <div className="bg-surface-container-lowest rounded-xl card-shadow p-4 flex flex-col gap-2">
            <div className="font-label-md text-label-md">
              Nenhum pedido encontrado
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Verifique o e-mail ou o telefone, ou{" "}
              <Link href="/produtos" className="text-primary underline">
                faça um novo pedido
              </Link>
              .
            </p>
          </div>
        )}

        {results !== null && results.length > 1 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider pl-1">
              {results.length} pedidos encontrados
            </h2>
            {results.map(({ order, token }) => (
              <Link
                key={order.code}
                href={"/pedido/" + order.code + (token ? "?token=" + token : "")}
                className="bg-surface-container-lowest rounded-xl card-shadow p-4 flex items-center gap-3 border border-outline-variant/20"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-label-md text-label-md text-primary">
                      {order.code}
                    </span>
                    <span
                      className={
                        "px-2 py-0.5 rounded-full font-label-sm text-[10px] uppercase tracking-wide " +
                        (ORDER_STATUS_BADGE[order.status] ?? "")
                      }
                    >
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {orderCount(order)} itens · {formatCVE(orderTotal(order))}
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">
                  chevron_right
                </span>
              </Link>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

// useSearchParams needs a Suspense boundary for static rendering.
export default function PedidoLookupPage() {
  return (
    <Suspense fallback={<div className="min-h-[100dvh] bg-surface" />}>
      <LookupScreen />
    </Suspense>
  );
}
