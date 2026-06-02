"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "../components/Header";
import CatalogEditor, { type Cart } from "../components/CatalogEditor";
import OrderLines from "../components/OrderLines";
import {
  listProducts,
  productMap,
  FALLBACK_IMAGE,
  formatCVE,
  PRODUCT_TYPE_LABEL,
  type Product,
} from "@/lib/products";
import { createOrder, findOrders, type Order } from "@/lib/storage";
import { isValidCVPhone, CV_PHONE_PLACEHOLDER } from "@/lib/phone";

type Step = "catalog" | "contact" | "done";

export default function NewOrderPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("catalog");
  const [cart, setCart] = useState<Cart>({});
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [order, setOrder] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let alive = true;
    listProducts({ activeOnly: true })
      .then((list) => alive && setProducts(list))
      .catch((err) => {
        console.error("Falha ao carregar produtos", err);
        if (alive) setLoadError("Não foi possível carregar o catálogo.");
      })
      .finally(() => alive && setLoadingProducts(false));
    return () => {
      alive = false;
    };
  }, []);

  const prodMap = useMemo(() => productMap(products), [products]);

  const { total, count } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const [productId, qty] of Object.entries(cart)) {
      const p = prodMap[productId];
      if (p) {
        total += p.price * qty;
        count += qty;
      }
    }
    return { total, count };
  }, [cart, prodMap]);

  function validateContact(): boolean {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      e.email = "E-mail inválido.";
    if (!isValidCVPhone(phone))
      e.phone = "Número inválido. Use um número de Cabo Verde (7 dígitos).";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validateContact()) return;
    if (submitting) return;
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => {
        const p = prodMap[productId];
        return { pinId: productId, name: p?.name, price: p?.price, qty };
      });
    setSubmitting(true);
    try {
      // If this email/phone already has an order, don't create a duplicate —
      // send the user to the search page (pre-filled) to edit the existing one.
      const existing = await findOrders(email.trim(), phone.trim());
      if (existing.length > 0) {
        const params = new URLSearchParams({
          email: email.trim(),
          phone: phone.trim(),
        });
        router.push(`/editar?${params.toString()}`);
        return;
      }
      const created = await createOrder({
        email: email.trim(),
        phone: phone.trim(),
        items,
      });
      setOrder(created);
      setStep("done");
    } catch (err) {
      console.error("Falha ao criar o pedido", err);
      setErrors({
        submit: "Não foi possível salvar o pedido. Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Confirmation ---------- */
  if (step === "done" && order) {
    return (
      <main>
        <Header title="Pedido confirmado" />
        <div className="page">
          <div className="confirm">
            <div className="check">✓</div>
            <h2 style={{ margin: "0 0 4px" }}>Tudo certo!</h2>
            <p className="muted">
              Para editar este pedido depois, use o seu <strong>e-mail</strong>{" "}
              ou <strong>telefone</strong> na opção “Editar pedido”.
            </p>
            <div className="code-box">
              <div className="label">Código do pedido</div>
              <div className="code">{order.code}</div>
            </div>
          </div>

          <div className="card">
            <OrderLines items={order.items} products={prodMap} />
            <div
              className="summary-line"
              style={{ borderBottom: "none", paddingBottom: 0 }}
            >
              <div className="ln-name">Total</div>
              <div className="ln-total">{formatCVE(total)}</div>
            </div>
          </div>

          <Link
            href="/"
            className="btn block"
            style={{ display: "block", textAlign: "center", marginTop: 20 }}
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  /* ---------- Resumo / contact step ---------- */
  if (step === "contact") {
    const items = Object.entries(cart).filter(([, qty]) => qty > 0);
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background text-on-background pb-[100px]">
        {/* Header */}
        <header className="bg-surface-container-lowest sticky top-0 z-40 py-4 shadow-sm">
          <div className="max-w-2xl mx-auto w-full px-margin-mobile flex items-center">
            <button
              aria-label="Voltar"
              onClick={() => setStep("catalog")}
              className="text-primary p-2 -ml-2 rounded-full hover:bg-surface-container-low transition-colors active:scale-95"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}
              >
                arrow_back
              </span>
            </button>
            <h1 className="font-headline-md text-headline-md text-on-surface ml-2 flex-1">
              Resumo do Pedido
            </h1>
          </div>
        </header>

        {/* Progress: final step */}
        <div className="w-full h-1 bg-surface-container-highest">
          <div className="h-full bg-primary w-full rounded-r-full" />
        </div>

        <main className="flex-1 px-margin-mobile py-6 flex flex-col gap-6 max-w-2xl mx-auto w-full">
          {/* Selected items */}
          <section className="flex flex-col gap-3">
            <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider pl-1">
              Itens Selecionados
            </h2>
            <div className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-4">
              {items.map(([productId, qty], i) => {
                const p = prodMap[productId];
                if (!p) return null;
                return (
                  <Fragment key={productId}>
                    {i > 0 && <div className="h-px w-full bg-surface-variant" />}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg bg-surface-container-low overflow-hidden border border-outline-variant/30 shrink-0">
                        <img
                          src={p.image || FALLBACK_IMAGE}
                          alt={p.name}
                          onError={(e) => {
                            if (e.currentTarget.src !== FALLBACK_IMAGE)
                              e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <h3 className="font-body-md text-body-md font-semibold text-on-surface">
                          {p.name}
                        </h3>
                        <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                          {PRODUCT_TYPE_LABEL[p.type] ?? p.type}
                        </p>
                      </div>
                      <div className="bg-primary-container text-on-primary-container font-label-md text-label-md px-3 py-1.5 rounded-full shrink-0 flex items-center justify-center min-w-[2.5rem]">
                        {qty}
                      </div>
                    </div>
                  </Fragment>
                );
              })}
              <div className="mt-2 pt-3 border-t border-surface-variant flex justify-between items-center">
                <span className="font-body-md text-body-md text-on-surface-variant">
                  Total de Itens
                </span>
                <span className="font-headline-md text-headline-md text-primary">
                  {count}
                </span>
              </div>
            </div>
          </section>

          {/* Contact info */}
          <section className="flex flex-col gap-3 mt-2">
            <div className="flex items-center gap-2 pl-1">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontSize: 20 }}
              >
                contact_mail
              </span>
              <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Dados de Contato
              </h2>
            </div>
            <div className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-4">
              <p className="font-label-sm text-label-sm text-on-surface-variant mb-1">
                Para localizar e atualizar o seu pedido depois.
              </p>

              {/* E-mail */}
              <div className="flex flex-col gap-1.5 input-focus-effect transition-transform duration-200">
                <label
                  className="font-label-md text-label-md text-on-surface"
                  htmlFor="email"
                >
                  E-mail <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                    style={{ fontSize: 20 }}
                  >
                    mail
                  </span>
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full bg-surface-container-low border-b-2 border-transparent border-b-outline-variant focus:border-b-primary text-on-surface font-body-md text-body-md pl-10 pr-3 py-3 rounded-t-md outline-none transition-colors placeholder:text-outline/60"
                  />
                </div>
                {errors.email && (
                  <span className="text-error font-label-sm text-label-sm">
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Telefone / WhatsApp */}
              <div className="flex flex-col gap-1.5 input-focus-effect transition-transform duration-200">
                <label
                  className="font-label-md text-label-md text-on-surface"
                  htmlFor="phone"
                >
                  Telefone / WhatsApp <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <span
                    className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline"
                    style={{ fontSize: 20 }}
                  >
                    call
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={CV_PHONE_PLACEHOLDER}
                    className="w-full bg-surface-container-low border-b-2 border-transparent border-b-outline-variant focus:border-b-primary text-on-surface font-body-md text-body-md pl-10 pr-3 py-3 rounded-t-md outline-none transition-colors placeholder:text-outline/60"
                  />
                </div>
                {errors.phone && (
                  <span className="text-error font-label-sm text-label-sm">
                    {errors.phone}
                  </span>
                )}
              </div>
            </div>
          </section>
        </main>

        {/* Bottom action bar */}
        <div className="fixed bottom-0 left-0 w-full bg-surface-container-lowest p-margin-mobile pb-6 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-50">
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
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              {submitting ? "Salvando…" : "Confirmar Pedido"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Catalog step ---------- */
  return (
    <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-surface-container-high z-50">
        <div
          className="h-full bg-primary rounded-r-full transition-all duration-500"
          style={{ width: "50%" }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur-md pt-6 pb-4">
        <div className="max-w-2xl mx-auto w-full px-margin-mobile flex items-center gap-4">
          <Link
            href="/"
            aria-label="Voltar"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest shadow-sm border border-outline-variant/30 text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <div>
            <h1 className="font-headline-md text-headline-md text-primary">
              Selecionar Pins
            </h1>
            <p className="font-label-sm text-label-sm text-on-surface-variant">
              Passo 1 de 2
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 px-margin-mobile pb-32 pt-2 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {loadingProducts ? (
          <p className="text-center text-on-surface-variant py-10">
            A carregar catálogo…
          </p>
        ) : loadError ? (
          <p className="text-center text-error py-10">{loadError}</p>
        ) : products.length === 0 ? (
          <p className="text-center text-on-surface-variant py-10">
            Nenhum produto disponível no momento.
          </p>
        ) : (
          <CatalogEditor products={products} cart={cart} onChange={setCart} />
        )}
      </main>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-highest rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-safe border-t border-outline-variant/20">
        <div className="max-w-2xl mx-auto w-full px-margin-mobile py-4 flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Total de Pins
            </span>
            <div className="flex items-baseline gap-1">
              <span className="font-headline-lg-mobile text-headline-lg-mobile text-primary">
                {count}
              </span>
              <span className="font-label-sm text-label-sm text-primary/70">
                unid.
              </span>
            </div>
          </div>
          <button
            disabled={count === 0}
            onClick={() => setStep("contact")}
            className="flex-1 bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim transition-colors py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 card-shadow disabled:opacity-50"
          >
            <span className="font-label-md text-label-md">Revisar Pedido</span>
            <span className="material-symbols-outlined text-[20px]">
              arrow_forward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
