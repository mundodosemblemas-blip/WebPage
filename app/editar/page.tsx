"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import CatalogEditor, { type Cart } from "../components/CatalogEditor";
import { CV_PHONE_PLACEHOLDER } from "@/lib/phone";
import {
  listProducts,
  productMap,
  formatCVE,
  type Product,
} from "@/lib/products";
import {
  findOrders,
  updateOrder,
  orderCount,
  orderTotal,
  type Order,
} from "@/lib/storage";

type Step = "lookup" | "pick" | "edit" | "saved";

export default function EditOrderPage() {
  const [step, setStep] = useState<Step>("lookup");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [results, setResults] = useState<Order[]>([]);
  const [notFound, setNotFound] = useState(false);

  const [active, setActive] = useState<Order | null>(null);
  const [cart, setCart] = useState<Cart>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let alive = true;
    listProducts({ activeOnly: true })
      .then((list) => alive && setProducts(list))
      .catch((err) => console.error("Falha ao carregar produtos", err));
    return () => {
      alive = false;
    };
  }, []);

  const prodMap = useMemo(() => productMap(products), [products]);

  // Snapshot of name/price from the order being edited, used as a fallback for
  // items whose product is no longer in the active catalog.
  const snapshotMap = useMemo(() => {
    const m: Record<string, { name?: string; price?: number }> = {};
    if (active)
      for (const it of active.items) m[it.pinId] = { name: it.name, price: it.price };
    return m;
  }, [active]);

  const { total, count } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const [productId, qty] of Object.entries(cart)) {
      const price = prodMap[productId]?.price ?? snapshotMap[productId]?.price ?? 0;
      total += price * qty;
      count += qty;
    }
    return { total, count };
  }, [cart, prodMap, snapshotMap]);

  async function lookup(lookupEmail = email, lookupPhone = phone) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const found = await findOrders(lookupEmail, lookupPhone);
      setResults(found);
      setNotFound(found.length === 0);
      if (found.length === 1) selectOrder(found[0]);
      else if (found.length > 1) setStep("pick");
    } catch (err) {
      console.error("Falha ao localizar o pedido", err);
      setError("Não foi possível buscar o pedido. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  // When redirected here from the "new order" flow (because an order already
  // exists for this contact), pre-fill the fields from the URL and look it up.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const e = params.get("email") ?? "";
    const p = params.get("phone") ?? "";
    if (e || p) {
      setEmail(e);
      setPhone(p);
      setNotice("Já existe um pedido com este contato. Edite-o abaixo.");
      lookup(e, p);
    }
    // Run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function selectOrder(order: Order) {
    setActive(order);
    const c: Cart = {};
    for (const it of order.items) c[it.pinId] = it.qty;
    setCart(c);
    setStep("edit");
  }

  async function save() {
    if (!active || busy) return;
    const items = Object.entries(cart)
      .filter(([, qty]) => qty > 0)
      .map(([productId, qty]) => ({
        pinId: productId,
        name: prodMap[productId]?.name ?? snapshotMap[productId]?.name,
        price: prodMap[productId]?.price ?? snapshotMap[productId]?.price,
        qty,
      }));
    setBusy(true);
    setError("");
    try {
      await updateOrder(active.code, { items });
      setStep("saved");
    } catch (err) {
      console.error("Falha ao salvar o pedido", err);
      setError("Não foi possível salvar as alterações. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------- Saved ---------- */
  if (step === "saved" && active) {
    return (
      <main>
        <Header title="Pedido atualizado" />
        <div className="page">
          <div className="confirm">
            <div className="check">✓</div>
            <h2 style={{ margin: "0 0 4px" }}>Pedido atualizado!</h2>
            <p className="muted">Código {active.code}</p>
            <div className="code-box">
              <div className="label">Novo total</div>
              <div className="code">{formatCVE(total)}</div>
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

  /* ---------- Edit ---------- */
  if (step === "edit" && active) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-surface text-on-surface">
        <Header
          title="Editar pedido"
          subtitle={`${active.code} · ${active.email}`}
          back
        />

        <main className="flex-1 px-margin-mobile pb-32 pt-4 flex flex-col gap-4 max-w-2xl mx-auto w-full">
          {notice && (
            <div className="bg-primary-container text-on-primary-container rounded-xl px-4 py-3 font-label-md text-label-md flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px]">info</span>
              {notice}
            </div>
          )}
          <CatalogEditor products={products} cart={cart} onChange={setCart} />
        </main>

        {/* Bottom bar */}
        <div className="fixed bottom-0 left-0 w-full z-50 bg-surface-container-highest rounded-t-2xl shadow-[0_-8px_24px_rgba(0,0,0,0.08)] pb-safe border-t border-outline-variant/20">
          <div className="max-w-2xl mx-auto w-full px-margin-mobile py-4 flex flex-col gap-2">
            {error && (
              <p className="text-error font-label-sm text-label-sm">{error}</p>
            )}
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Total
                </span>
                <span className="font-headline-md text-headline-md text-primary">
                  {formatCVE(total)}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {count} {count === 1 ? "pin" : "pins"}
                </span>
              </div>
              <button
                disabled={count === 0 || busy}
                onClick={save}
                className="flex-1 bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim transition-colors py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 card-shadow disabled:opacity-50"
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  check_circle
                </span>
                <span className="font-label-md text-label-md">
                  {busy ? "Salvando…" : "Salvar alterações"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Pick (multiple matches) ---------- */
  if (step === "pick") {
    return (
      <main>
        <Header title="Escolha o pedido" subtitle="Vários encontrados" back />
        <div className="page">
          {notice && (
            <div className="card" style={{ marginBottom: 16 }}>
              {notice}
            </div>
          )}
          {results.map((o) => (
            <button
              key={o.code}
              className="order-pick"
              onClick={() => selectOrder(o)}
            >
              <div>
                <div className="ln-name">{o.code}</div>
                <div className="ln-sub">
                  {orderCount(o)} pins · {formatCVE(orderTotal(o))}
                </div>
              </div>
              <div className="chev">›</div>
            </button>
          ))}
        </div>
      </main>
    );
  }

  /* ---------- Lookup ---------- */
  return (
    <main>
      <Header title="Editar pedido" subtitle="Localize o seu pedido" back />
      <div className="page">
        <p className="muted" style={{ marginTop: 0 }}>
          Digite o e-mail <strong>ou</strong> o telefone usados no pedido.
        </p>
        <div className="field">
          <label>E-mail</label>
          <input
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setNotFound(false);
            }}
            placeholder="voce@exemplo.com"
          />
        </div>
        <div className="field">
          <label>Telefone</label>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setNotFound(false);
            }}
            placeholder={CV_PHONE_PLACEHOLDER}
          />
        </div>

        {notFound && (
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              Nenhum pedido encontrado
            </div>
            <div className="muted">
              Verifique o e-mail ou o telefone, ou{" "}
              <Link href="/novo" style={{ color: "var(--primary)" }}>
                faça um novo pedido
              </Link>
              .
            </div>
          </div>
        )}

        {error && (
          <div className="card" style={{ marginBottom: 16, color: "var(--danger)" }}>
            {error}
          </div>
        )}

        <button
          className="btn block"
          disabled={(!email.trim() && !phone.trim()) || busy}
          onClick={() => lookup()}
        >
          {busy ? "Localizando…" : "Localizar pedido"}
        </button>
      </div>
    </main>
  );
}
