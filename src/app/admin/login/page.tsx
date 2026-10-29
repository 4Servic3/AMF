"use client";
import { useActionState } from "react";
import { login } from "../actions/auth";
export default function Login() {
  const [state, action, busy] = useActionState(login, { error: "" });
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5 py-16">
      <p className="mb-6 text-center font-serif text-4xl text-[var(--admin-tint)]">AMF</p>
      <section className="amf-panel">
        <h1 className="mb-1 text-[28px]">Bem-vindo de volta</h1>
        <p className="mb-7 text-[15px] text-[var(--admin-secondary)]">
          Entre na central administrativa.
        </p>
        <form action={action} className="space-y-5">
          <label className="block">
            E-mail
            <input
              className="mt-2 w-full"
              name="email"
              type="email"
              autoComplete="username"
              required
            />
          </label>
          <label className="block">
            Senha
            <input
              className="mt-2 w-full"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {state.error && (
            <p role="alert" className="text-sm text-red-700">
              {state.error}
            </p>
          )}
          <button className="amf-primary w-full" disabled={busy}>
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
