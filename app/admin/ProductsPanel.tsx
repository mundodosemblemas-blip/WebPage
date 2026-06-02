"use client";

import { useEffect, useState } from "react";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  PRODUCT_TYPES,
  PRODUCT_TYPE_LABEL,
  FALLBACK_IMAGE,
  formatCVE,
  type Product,
  type ProductType,
} from "@/lib/products";

interface FormState {
  name: string;
  type: ProductType;
  price: string;
  image: string;
  active: boolean;
  sortOrder: string;
}

function emptyForm(): FormState {
  return { name: "", type: "pin", price: "", image: "", active: true, sortOrder: "0" };
}

function toForm(p: Product): FormState {
  return {
    name: p.name,
    type: p.type,
    price: String(p.price),
    image: p.image ?? "",
    active: p.active,
    sortOrder: String(p.sortOrder),
  };
}

export default function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // editingId: null = closed, "new" = create, otherwise a product id
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setProducts(await listProducts());
    } catch (e) {
      console.error("Falha ao carregar produtos", e);
      setError("Não foi possível carregar os produtos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(emptyForm());
    setFormError("");
    setEditingId("new");
  }

  function openEdit(p: Product) {
    setForm(toForm(p));
    setFormError("");
    setEditingId(p.id);
  }

  function closeForm() {
    setEditingId(null);
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const name = form.name.trim();
    const price = Number(form.price);
    if (!name) return setFormError("Informe o nome.");
    if (!Number.isFinite(price) || price < 0)
      return setFormError("Preço inválido.");

    const payload = {
      name,
      type: form.type,
      price: Math.round(price),
      image: form.image.trim() || null,
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
    };

    setSaving(true);
    setFormError("");
    try {
      if (editingId === "new") {
        const created = await createProduct(payload);
        setProducts((list) => [...list, created]);
      } else if (editingId) {
        const updated = await updateProduct(editingId, payload);
        if (updated)
          setProducts((list) =>
            list.map((p) => (p.id === editingId ? updated : p))
          );
      }
      setEditingId(null);
    } catch (err) {
      console.error("Falha ao salvar o produto", err);
      setFormError("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: Product) {
    try {
      const updated = await updateProduct(p.id, { active: !p.active });
      if (updated)
        setProducts((list) => list.map((x) => (x.id === p.id ? updated : x)));
    } catch (e) {
      console.error("Falha ao atualizar", e);
      alert("Não foi possível atualizar o produto.");
    }
  }

  async function remove(p: Product) {
    if (
      !confirm(
        `Apagar "${p.name}"? Pedidos antigos mantêm o registo, mas o produto deixa de existir. Para apenas ocultar, use o botão de ativar/desativar.`
      )
    )
      return;
    try {
      await deleteProduct(p.id);
      setProducts((list) => list.filter((x) => x.id !== p.id));
    } catch (e) {
      console.error("Falha ao apagar o produto", e);
      alert("Não foi possível apagar o produto.");
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

      {/* Add / edit form */}
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
              onClick={closeForm}
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
            <Field label="Preço (CVE)" className="flex-1">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Imagem (caminho em /public ou URL)">
            <input
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              placeholder="/passarinhos.jpg"
              className={inputCls}
            />
          </Field>

          <div className="flex items-center gap-4">
            <Field label="Ordem" className="w-28">
              <input
                type="number"
                inputMode="numeric"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm({ ...form, sortOrder: e.target.value })
                }
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
              Ativo (visível no catálogo)
            </label>
          </div>

          {formError && (
            <p className="text-error font-label-sm text-label-sm">{formError}</p>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={closeForm}
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
            className={`bg-surface-container-lowest rounded-xl card-shadow p-3 flex items-center gap-3 ${
              p.active ? "" : "opacity-60"
            }`}
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
              <div className="font-label-sm text-label-sm text-on-surface-variant">
                {PRODUCT_TYPE_LABEL[p.type] ?? p.type} · {formatCVE(p.price)}
                {!p.active && " · oculto"}
              </div>
            </div>
            <button
              onClick={() => toggleActive(p)}
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
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="font-label-md text-label-md text-on-surface">
        {label}
      </span>
      {children}
    </label>
  );
}
