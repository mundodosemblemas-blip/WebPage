"use client";

// The managed club list behind the "Clube" field on products, and the club
// filter customers can browse by.

import { useCallback, useEffect, useState } from "react";
import type { Club } from "@/lib/types";

export default function ClubsPanel() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clubs");
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível carregar os clubes.");
        return;
      }
      setClubs(data.clubs);
    } catch {
      setError("Falha de ligação.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || adding) return;
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/clubs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, sortOrder: clubs.length }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error ?? "Não foi possível salvar o clube.");
        return;
      }
      setClubs((list) => [...list, data.club as Club]);
      setName("");
    } catch {
      setAddError("Falha de ligação.");
    } finally {
      setAdding(false);
    }
  }

  async function patch(club: Club, body: Record<string, unknown>) {
    try {
      const res = await fetch("/api/admin/clubs/" + club.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Não foi possível atualizar o clube.");
        return;
      }
      setClubs((list) =>
        list.map((c) => (c.id === club.id ? (data.club as Club) : c))
      );
    } catch {
      alert("Falha de ligação.");
    }
  }

  async function remove(club: Club) {
    if (
      !confirm(
        'Apagar o clube "' +
          club.name +
          '"? Os produtos deste clube não são apagados — ficam apenas sem clube.'
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/clubs/" + club.id, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Não foi possível apagar o clube.");
        return;
      }
      setClubs((list) => list.filter((c) => c.id !== club.id));
    } catch {
      alert("Falha de ligação.");
    }
  }

  function startRename(club: Club) {
    setEditingId(club.id);
    setEditName(club.name);
  }

  async function saveRename(club: Club) {
    const trimmed = editName.trim();
    setEditingId(null);
    if (!trimmed || trimmed === club.name) return;
    // The slug is left alone on rename so existing links keep working.
    await patch(club, { name: trimmed });
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
        Clubes
      </h2>

      <form
        onSubmit={add}
        className="bg-surface-container-lowest rounded-xl tactile-shadow p-4 flex flex-col gap-2"
      >
        <label className="font-label-md text-label-md" htmlFor="club-name">
          Novo clube
        </label>
        <div className="flex gap-2">
          <input
            id="club-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Clube Estrela do Mar"
            className="flex-1 bg-surface-container-low border-b-2 border-b-outline-variant focus:border-b-primary text-on-surface font-body-md text-body-md px-3 py-2.5 rounded-t-md outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={adding || !name.trim()}
            className="bg-primary text-on-primary font-label-md text-label-md px-4 py-2 rounded-xl disabled:opacity-50 active:scale-95 transition-transform flex-none"
          >
            {adding ? "A guardar…" : "Adicionar"}
          </button>
        </div>
        {addError && (
          <p className="text-error font-label-sm text-label-sm">{addError}</p>
        )}
      </form>

      {loading && (
        <p className="text-center text-on-surface-variant py-10">
          A carregar clubes…
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
        clubs.map((c) => (
          <div
            key={c.id}
            className={
              "bg-surface-container-lowest rounded-xl card-shadow p-3 flex items-center gap-3 " +
              (c.active ? "" : "opacity-60")
            }
          >
            <div className="flex-1 min-w-0">
              {editingId === c.id ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveRename(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveRename(c);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="w-full bg-surface-container-low border-b-2 border-b-primary text-on-surface font-body-md text-body-md px-2 py-1 rounded-t-md outline-none"
                />
              ) : (
                <>
                  <div className="font-body-md text-body-md font-semibold text-on-surface truncate">
                    {c.name}
                  </div>
                  <div className="font-label-sm text-label-sm text-on-surface-variant truncate">
                    /produtos?clube={c.slug ?? c.id}
                    {!c.active && " · oculto"}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => patch(c, { active: !c.active })}
              title={c.active ? "Ocultar" : "Mostrar"}
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-surface-container-low text-on-surface-variant"
            >
              <span className="material-symbols-outlined text-[20px]">
                {c.active ? "visibility" : "visibility_off"}
              </span>
            </button>
            <button
              onClick={() => startRename(c)}
              title="Renomear"
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-surface-container-low text-primary"
            >
              <span className="material-symbols-outlined text-[20px]">edit</span>
            </button>
            <button
              onClick={() => remove(c)}
              title="Apagar"
              className="w-9 h-9 grid place-items-center rounded-full hover:bg-error-container/40 text-error"
            >
              <span className="material-symbols-outlined text-[20px]">
                delete
              </span>
            </button>
          </div>
        ))}

      {!loading && !error && clubs.length === 0 && (
        <p className="text-center text-on-surface-variant py-8">
          Nenhum clube ainda. Adicione o primeiro acima.
        </p>
      )}
    </div>
  );
}
