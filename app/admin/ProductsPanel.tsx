"use client";

// Admin product catalog. All writes go through /api/admin/products, which
// checks the session cookie.
//
// This screen is the only place supplier cost and packing weight are shown or
// edited — those fields are stripped from every public query, so they never
// reach the storefront.

import { useCallback, useEffect, useState } from "react";
import {
  FALLBACK_IMAGE,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABEL,
  formatCVE,
  type AdminProduct,
  type Club,
  type ProductType,
} from "@/lib/types";

interface FormState {
  name: string;
  slug: string;
  description: string;
  type: ProductType;
  clubId: string;
  size: string;
  finish: string;
  price: string;
  costUsd50: string;
  costUsd100: string;
  pkgWeightG: string;
  image: string;
  active: boolean;
  sortOrder: string;
}

function emptyForm(): FormState {
  return {
    name: "",
    slug: "",
    description: "",
    type: "pin",
    clubId: "",
    size: "",
    finish: "",
    price: "",
    costUsd50: "",
    costUsd100: "",
    pkgWeightG: "",
    image: "",
    active: true,
    sortOrder: "0",
  };
}

function numToField(n: number | null): string {
  return n === null || n === undefined ? "" : String(n);
}

function toForm(p: AdminProduct): FormState {
  return {
    name: p.name,
    slug: p.slug ?? "",
    description: p.description ?? "",
    type: p.type,
    clubId: p.clubId ?? "",
    size: p.size ?? "",
    finish: p.finish ?? "",
    price: String(p.price),
    costUsd50: numToField(p.costUsd50),
    costUsd100: numToField(p.costUsd100),
    pkgWeightG: numToField(p.pkgWeightG),
    image: p.image ?? "",
    active: p.active,
    sortOrder: String(p.sortOrder),
  };
}

// Supplier costs are USD; the sale price is CVE. They are shown side by side
// but never combined, since the app has no exchange rate to convert with.
function formatUSD(n: number | null): string {
  return n === null ? "—" : "$" + n.toFixed(2);
}

export default function ProductsPanel() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // null = closed, "new" = create, otherwise a product id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      // Clubs are needed for the picker, so both load together.
      const [pRes, cRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/clubs"),
      ]);
      const pData = await pRes.json();
      if (!pRes.ok) {
        setError(pData.error ?? "Não foi possível carregar os produtos.");
        return;
      }
      setProducts(pData.products);
      if (cRes.ok) setClubs((await cRes.json()).clubs ?? []);
    } catch {
      setError("Falha de ligação.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openNew() {
    setForm(emptyForm());
    setFormError("");
    setEditingId("new");
  }

  function openEdit(p: AdminProduct) {
    setForm(toForm(p));
    setFormError("");
    setEditingId(p.id);
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    const name = form.name.trim();
    const price = Number(form.price);
    if (!name) return setFormError("Informe o nome.");
    if (!Number.isFinite(price) || price < 0)
      return setFormError("Preço de venda inválido.");

    // Empty strings are sent through as-is: the server reads them as "clear
    // this column", which is how a cost is removed once entered.
    const payload = {
      name,
      slug: form.slug.trim(),
      description: form.description.trim(),
      type: form.type,
      clubId: form.clubId,
      size: form.size.trim(),
      finish: form.finish.trim(),
      price: Math.round(price),
      costUsd50: form.costUsd50.trim(),
      costUsd100: form.costUsd100.trim(),
      pkgWeightG: form.pkgWeightG.trim(),
      image: form.image.trim(),
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
    };

    setSaving(true);
    setFormError("");
    try {
      const creating = editingId === "new";
      const res = await fetch(
        creating ? "/api/admin/products" : "/api/admin/products/" + editingId,
        {
          method: creating ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Não foi possível salvar.");
        return;
      }
      const product = data.product as AdminProduct;
      setProducts((list) =>
        creating
          ? [...list, product]
          : list.map((p) => (p.id === product.id ? product : p))
      );
      setEditingId(null);
    } catch {
      setFormError("Falha de ligação. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function patch(p: AdminProduct, body: Record<string, unknown>) {
    try {
      const res = await fetch("/api/admin/products/" + p.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Não foi possível atualizar o produto.");
        return;
      }
      setProducts((list) =>
        list.map((x) => (x.id === p.id ? (data.product as AdminProduct) : x))
      );
    } catch {
      alert("Falha de ligação.");
    }
  }

  async function remove(p: AdminProduct) {
    if (
      !confirm(
        'Apagar "' +
          p.name +
          '"? Os pedidos antigos mantêm o registo, mas o produto deixa de existir. Para apenas o esconder, use o botão de mostrar/ocultar.'
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/products/" + p.id, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Não foi possível apagar o produto.");
        return;
      }
      setProducts((list) => list.filter((x) => x.id !== p.id));
    } catch {
      alert("Falha de ligação.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
          Produtos
        </h2>
        <button
          onClick={openNew}
          className="flex items-center gap-1 bg-primary text-on-primary font-label-md text-label-md px-3 py-2 rounded-xl active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Adicionar
        </button>
      </div>

      {editingId && (
        <form
          onSubmit={saveForm}
          className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-headline-md text-headline-md text-on-surface">
              {editingId === "new" ? "Novo produto" : "Editar produto"}
            </h3>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="w-8 h-8 grid place-items-center rounded-full hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <Field label="Nome">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
              autoFocus
            />
          </Field>

          <div className="flex gap-3">
            <Field label="Tipo" className="flex-1">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as ProductType })
                }
                className={inputCls}
              >
                {PRODUCT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Clube" className="flex-1">
              <select
                value={form.clubId}
                onChange={(e) => setForm({ ...form, clubId: e.target.value })}
                className={inputCls}
              >
                <option value="">— Sem clube —</option>
                {clubs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.active ? "" : " (oculto)"}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="flex gap-3">
            <Field label="Tamanho" className="flex-1">
              <input
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                placeholder="25 mm"
                className={inputCls}
              />
            </Field>
            <Field label="Esmalte / acabamento" className="flex-1">
              <input
                value={form.finish}
                onChange={(e) => setForm({ ...form, finish: e.target.value })}
                placeholder="Soft enamel, dourado"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Internal figures. Never shown in the storefront. */}
          <fieldset className="border border-outline-variant/40 rounded-xl p-3 flex flex-col gap-3">
            <legend className="px-1 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Interno — não aparece na loja
            </legend>
            <div className="flex gap-3">
              <Field label="Custo 50 un. (USD)" className="flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={form.costUsd50}
                  onChange={(e) => setForm({ ...form, costUsd50: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Custo 100 un. (USD)" className="flex-1">
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  value={form.costUsd100}
                  onChange={(e) => setForm({ ...form, costUsd100: e.target.value })}
                  className={inputCls}
                />
              </Field>
              <Field label="Peso (g)" className="w-28">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.pkgWeightG}
                  onChange={(e) => setForm({ ...form, pkgWeightG: e.target.value })}
                  className={inputCls}
                />
              </Field>
            </div>
          </fieldset>

          <Field label="Preço de venda (CVE)">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Descrição (aparece na página do produto)">
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className={inputCls + " resize-y"}
            />
          </Field>

          <Field label="Imagem (caminho em /public ou URL)">
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="/passarinhos.jpg"
              className={inputCls}
            />
          </Field>

          <Field label="Link (deixe vazio para gerar a partir do nome)">
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="passarinhos"
              className={inputCls}
            />
          </Field>

          <div className="flex items-center gap-4">
            <Field label="Ordem" className="w-28">
              <input
                type="number"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                className={inputCls}
              />
            </Field>
            <label className="flex items-center gap-2 mt-5 font-body-md text-body-md text-on-surface">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-5 h-5 accent-primary"
              />
              Ativo (visível na loja)
            </label>
          </div>

          {formError && (
            <p className="text-error font-label-sm text-label-sm">{formError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="px-4 py-2 rounded-xl font-label-md text-label-md bg-surface-container-high text-on-surface"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl font-label-md text-label-md bg-primary text-on-primary disabled:opacity-50 active:scale-95 transition-transform"
            >
              {saving ? "A guardar…" : "Guardar"}
            </button>
          </div>
        </form>
      )}

      {loading && (
        <p className="text-center text-on-surface-variant py-10">
          A carregar produtos…
        </p>
      )}

      {error && (
        <div className="text-center py-10">
          <p className="text-error mb-3">{error}</p>
          <button
            onClick={load}
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-md text-label-md"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {!loading &&
        !error &&
        products.map((p) => (
          <div
            key={p.id}
            className={
              "bg-surface-container-lowest rounded-xl card-shadow p-3 flex items-center gap-3 " +
              (p.active ? "" : "opacity-60")
            }
          >
            <div className="w-14 h-14 rounded-lg bg-surface-container-low overflow-hidden flex-none">
              <img
                src={p.image || FALLBACK_IMAGE}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  if (e.currentTarget.src !== FALLBACK_IMAGE)
                    e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-body-md text-body-md font-semibold text-on-surface truncate">
                {p.name}
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant truncate">
                {PRODUCT_TYPE_LABEL[p.type] ?? p.type}
                {p.clubName ? " · " + p.clubName : ""}
                {p.size ? " · " + p.size : ""}
                {" · "}
                {formatCVE(p.price)}
                {!p.active && " · oculto"}
              </div>
              {/* Internal figures, admin-only. */}
              <div className="font-label-sm text-label-sm text-outline truncate">
                custo 50: {formatUSD(p.costUsd50)} · 100:{" "}
                {formatUSD(p.costUsd100)}
                {p.pkgWeightG !== null ? " · " + p.pkgWeightG + " g" : ""}
              </div>
            </div>
            <button
              onClick={() => patch(p, { active: !p.active })}
              title={p.active ? "Ocultar" : "Mostrar"}
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-surface-container-low text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">
                {p.active ? "visibility" : "visibility_off"}
              </span>
            </button>
            <button
              onClick={() => openEdit(p)}
              title="Editar"
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-surface-container-low text-primary"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              onClick={() => remove(p)}
              title="Apagar"
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-error-container/40 text-error"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </button>
          </div>
        ))}

      {!loading && !error && products.length === 0 && (
        <p className="text-center text-on-surface-variant py-8">
          Nenhum produto. Use “Adicionar” para criar o primeiro.
        </p>
      )}
    </div>
  );
}

const inputCls =
  "w-full bg-surface-container-low border-b-2 border-b-outline-variant focus:border-b-primary text-on-surface font-body-md text-body-md px-3 py-2.5 rounded-t-md outline-none transition-colors";

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={"flex flex-col gap-1 " + className}>
      <span className="font-label-md text-label-md text-on-surface">
        {label}
      </span>
      {children}
    </label>
  );
}
