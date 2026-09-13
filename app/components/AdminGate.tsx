"use client";

// Wraps the admin UI behind the password form.
//
// Authorisation itself lives in an httpOnly cookie that the admin API routes
// verify — this component only decides whether to show the form or the
// dashboard, and asks the server on mount whether the session is still valid.

import { useEffect, useState } from "react";

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/session")
      .then((res) => res.json())
      .then((data) => alive && setAuthed(Boolean(data.ok)))
      .catch(() => alive && setAuthed(false))
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setAuthed(true);
        setPassword("");
      } else {
        setError(data.error || "Senha incorreta.");
      }
    } catch {
      setError("Falha de ligação. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;
  if (authed) return <>{children}</>;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-margin-mobile">
      <form
        onSubmit={submit}
        className="w-full max-w-sm bg-surface-container-lowest rounded-xl tactile-shadow p-6 flex flex-col gap-4"
      >
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container grid place-items-center">
            <span className="material-symbols-outlined">lock</span>
          </div>
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Área de administração
          </h1>
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Introduza a senha para continuar.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            className="font-label-md text-label-md text-on-surface"
            htmlFor="admin-password"
          >
            Senha
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="w-full bg-surface-container-low border-b-2 border-b-outline-variant focus:border-b-primary text-on-surface font-body-md text-body-md px-3 py-3 rounded-t-md outline-none transition-colors"
          />
          {error && (
            <span className="text-error font-label-sm text-label-sm">
              {error}
            </span>
          )}
        </div>

        <button
          type="submit"
          disabled={busy || !password}
          className="w-full bg-primary text-on-primary font-label-md text-label-md py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
        >
          {busy ? "A verificar…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
