"use client";

// Checkout: contact details, then place the order.
//
// The cart is sent as ids and quantities only — the server resolves the real
// names and prices from the catalog, so nothing here needs to be trusted.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StoreHeader from "../components/StoreHeader";
import { useCart } from "@/lib/cart";
import { CV_PHONE_PLACEHOLDER, isValidCVPhone } from "@/lib/phone";
import { notifyOrder } from "@/lib/notify";
import { FALLBACK_IMAGE, formatCVE, type Order } from "@/lib/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function FinalizarPage() {
  const router = useRouter();
  const { lines, ready, count, total, clear } = useCart();

  const [name, setName] = useState("");
  const [club, setClub] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState<Order | null>(null);

  // An empty cart has nothing to check out. Skipped once the order is placed,
  // since clearing the cart is exactly what success does.
  useEffect(() => {
    if (ready && lines.length === 0 && !placed) router.replace("/carrinho");
  }, [ready, lines.length, placed, router]);

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) e.email = "E-mail inválido.";
    if (!isValidCVPhone(phone))
      e.phone = "Número inválido. Use um número de Cabo Verde (7 dígitos).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (submitting || !validate()) return;
    setSubmitting(true);
    setErrors({});

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          name: name.trim(),
          club: club.trim(),
          items: lines.map((l) => ({ productId: l.productId, qty: l.qty })),
        }),
      });
      const data = await res.json();

      // They already have an order waiting for confirmation — send them to it
      // instead of creating a second one.
      if (res.status === 409 && data.error === "pending-order-exists") {
        const params = new URLSearchParams({
          email: email.trim(),
          phone: phone.trim(),
        });
        router.push("/pedido?" + params.toString());
        return;
      }

      if (!res.ok) {
        setErrors({ submit: data.error ?? "Não foi possível enviar o pedido." });
        return;
      }

      notifyOrder(data.order.code, "created");
      setPlaced(data.order);
      clear();
    } catch (err) {
      console.error("Falha ao enviar o pedido", err);
      setErrors({ submit: "Falha de ligação. Tente novamente." });
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Order placed ---------- */
  if (placed) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
        <StoreHeader title="Pedido enviado" showCart={false} />
        <main className="flex-1 max-w-2xl mx-auto w-full px-margin-mobile py-8 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-primary-container text-on-primary-container grid place-items-center">
              <span className="material-symbols-outlined text-[44px]">
                check_circle
              </span>
            </div>
            <h2 className="font-headline-lg text-headline-lg">
              Pedido recebido!
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Enviámos um e-mail para <strong>{placed.email}</strong> com o
              resumo e um link para o seu pedido.
            </p>
          </div>

          <div className="bg-primary-container/40 border border-dashed border-primary rounded-xl p-4 text-center">
            <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Código do pedido
            </div>
            <div className="font-headline-lg text-headline-lg text-primary tracking-wider">
              {placed.code}
            </div>
          </div>

          {/* The whole point of the pending status, said plainly. */}
          <div className="bg-surface-container-lowest rounded-xl card-shadow p-4 flex gap-3 items-start">
            <span className="material-symbols-outlined text-primary">
              edit_calendar
            </span>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Ainda pode alterar este pedido até nós o confirmarmos. Depois
              disso, fale connosco para qualquer mudança.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href={"/pedido?email=" + encodeURIComponent(placed.email)}
              className="w-full bg-primary text-on-primary py-3.5 rounded-xl text-center font-label-md text-label-md active:scale-95 transition-transform"
            >
              Ver ou alterar o meu pedido
            </Link>
            <Link
              href="/produtos"
              className="w-full bg-surface-container-low text-on-surface py-3.5 rounded-xl text-center font-label-md text-label-md"
            >
              Voltar à loja
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!ready || lines.length === 0) {
    return (
      <div className="min-h-[100dvh] bg-surface">
        <StoreHeader title="Finalizar pedido" back showCart={false} />
      </div>
    );
  }

  /* ---------- Contact form ---------- */
  const inputCls =
    "w-full bg-surface-container-low border-b-2 border-transparent border-b-outline-variant focus:border-b-primary text-on-surface font-body-md text-body-md pl-10 pr-3 py-3 rounded-t-md outline-none transition-colors placeholder:text-outline/60";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface pb-32">
      <StoreHeader title="Finalizar pedido" back showCart={false} />

      <main className="flex-1 max-w-2xl mx-auto w-full px-margin-mobile py-6 flex flex-col gap-6">
        {/* Order summary */}
        <section className="flex flex-col gap-3">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider pl-1">
            O seu pedido
          </h2>
          <div className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-3">
            {lines.map((l) => (
              <div key={l.productId} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-surface-container-low overflow-hidden flex-none">
                  <img
                    src={l.image || FALLBACK_IMAGE}
                    alt={l.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-body-md text-body-md text-on-surface truncate">
                    {l.name}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant">
                    {l.qty} x {formatCVE(l.price)}
                  </div>
                </div>
                <div className="font-label-md text-label-md text-on-surface">
                  {formatCVE(l.price * l.qty)}
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-surface-variant flex justify-between items-center">
              <span className="font-body-md text-body-md text-on-surface-variant">
                Total ({count} {count === 1 ? "item" : "itens"})
              </span>
              <span className="font-headline-md text-headline-md text-primary">
                {formatCVE(total)}
              </span>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="flex flex-col gap-3">
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider pl-1">
            Dados de contacto
          </h2>
          <div className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-4">
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Usamos estes dados para lhe enviar o pedido e para o encontrar
              caso queira alterá-lo.
            </p>

            <Field label="Nome" icon="person" htmlFor="name">
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="O seu nome"
                className={inputCls}
              />
            </Field>

            <Field label="Clube" icon="groups" htmlFor="club">
              <input
                id="club"
                value={club}
                onChange={(e) => setClub(e.target.value)}
                placeholder="Nome do clube (opcional)"
                className={inputCls}
              />
            </Field>

            <Field label="E-mail" icon="mail" htmlFor="email" required error={errors.email}>
              <input
                id="email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className={inputCls}
              />
            </Field>

            <Field
              label="Telefone / WhatsApp"
              icon="call"
              htmlFor="phone"
              required
              error={errors.phone}
            >
              <input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={CV_PHONE_PLACEHOLDER}
                className={inputCls}
              />
            </Field>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest p-margin-mobile pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-40">
        <div className="max-w-2xl mx-auto w-full">
          {errors.submit && (
            <p className="text-error font-label-sm text-label-sm text-center mb-3">
              {errors.submit}
            </p>
          )}
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full bg-secondary-container hover:bg-secondary-fixed active:scale-95 text-on-secondary-container font-headline-md text-headline-md py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60 disabled:active:scale-100"
          >
            <span className="material-symbols-outlined">check_circle</span>
            {submitting ? "A enviar…" : "Enviar pedido"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  icon,
  htmlFor,
  required,
  error,
  children,
}: {
  label: string;
  icon: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 input-focus-effect transition-transform duration-200">
      <label className="font-label-md text-label-md text-on-surface" htmlFor={htmlFor}>
        {label} {required && <span className="text-error">*</span>}
      </label>
      <div className="relative">
        <span
          className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
          style={{ fontSize: 20 }}
        >
          {icon}
        </span>
        {children}
      </div>
      {error && (
        <span className="text-error font-label-sm text-label-sm">{error}</span>
      )}
    </div>
  );
}
