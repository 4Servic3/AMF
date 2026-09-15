"use client";
import { useActionState } from "react";
import { login } from "../actions/auth";
export default function Login() {
  const [state, action, busy] = useActionState(login, { error: "" });
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <p className="mb-8 font-serif text-3xl text-[#bda66a]">AMF</p>
      <section className="amf-panel">
        <h1 className="mb-2 text-3xl">Bem-vindo de volta</h1>
        <p className="mb-8 text-sm text-[#746e65]">
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
