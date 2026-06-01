"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "../components/Header";
import CatalogEditor, { type Cart } from "../components/CatalogEditor";
import { PIN_MAP, formatCVE } from "@/lib/pins";
import { CV_PHONE_PLACEHOLDER } from "@/lib/phone";
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

  const { total, count } = useMemo(() => {
    let total = 0;
    let count = 0;
    for (const [pinId, qty] of Object.entries(cart)) {
      const pin = PIN_MAP[pinId];
      if (pin) {
        total += pin.price * qty;
        count += qty;
      }
    }
    return { total, count };
  }, [cart]);

  async function lookup() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const found = await findOrders(email, phone);
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
      .map(([pinId, qty]) => ({ pinId, qty }));
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
      <main>
        <Header
          title="Editar pedido"
          subtitle={`${active.code} · ${active.email}`}
          back
        />
        <div className="page">
          <CatalogEditor cart={cart} onChange={setCart} />
        </div>
        <div className="bottom-bar">
          <div className="summary">
            <div className="total">{formatCVE(total)}</div>
            <div className="count">
              {count} {count === 1 ? "pin" : "pins"}
            </div>
          </div>
          {error && (
            <div className="muted" style={{ color: "var(--danger)" }}>
              {error}
            </div>
          )}
          <button
            className="btn success"
            disabled={count === 0 || busy}
            onClick={save}
          >
            {busy ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </main>
    );
  }

  /* ---------- Pick (multiple matches) ---------- */
  if (step === "pick") {
    return (
      <main>
        <Header title="Escolha o pedido" subtitle="Vários encontrados" back />
        <div className="page">
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
          onClick={lookup}
        >
          {busy ? "Localizando…" : "Localizar pedido"}
        </button>
      </div>
    </main>
  );
}
