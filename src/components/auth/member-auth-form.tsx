'use client';
import Link from 'next/link';
import { useActionState } from 'react';
import { register, recover, resetPassword } from '@/app/auth/actions';
export default function MemberAuthForm({ mode }: { mode: 'register' | 'recover' | 'reset' }) {
  const [state, action, pending] = useActionState(mode === 'register' ? register : mode === 'recover' ? recover : resetPassword, null);
  const title = mode === 'register' ? 'Crie sua conta' : mode === 'recover' ? 'Recuperar senha' : 'Definir nova senha';
  const inputClass = 'w-full rounded-md border border-(--color-amf-border) p-2.5 text-sm';
  return <main className="flex min-h-screen items-center justify-center bg-(--color-amf-creme) p-6"><div className="w-full max-w-md rounded-[20px] border border-(--color-amf-border) bg-white p-8 shadow-sm">
    <h1 className="mb-6 text-center font-editorial text-2xl font-bold text-(--color-amf-plum)">{title}</h1>
    {mode === 'register' && <p className="mb-5 text-sm">Criar uma conta não inclui a compra nem a liberação de produtos.</p>}
    <form action={action} className="space-y-4">
      {state?.error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
      {state?.message && <p role="status" className="rounded border p-3 text-sm">{state.message}</p>}
      {!state?.message && <>
        {mode === 'register' && <label className="block space-y-1"><span>Nome completo</span><input name="full_name" autoComplete="name" required minLength={2} maxLength={120} className={inputClass} /></label>}
        {mode !== 'reset' && <label className="block space-y-1"><span>E-mail</span><input name="email" type="email" autoComplete="email" required className={inputClass} /></label>}
        {mode !== 'recover' && <label className="block space-y-1"><span>Senha (mínimo 8 caracteres)</span><input name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className={inputClass} /></label>}
        {mode === 'reset' && <label className="block space-y-1"><span>Confirme a senha</span><input name="confirmation" type="password" autoComplete="new-password" required minLength={8} maxLength={128} className={inputClass} /></label>}
        {mode === 'register' && <p className="text-sm">Consulte os <Link href="/termos" className="underline">termos</Link> e a <Link href="/privacidade" className="underline">política de privacidade</Link>.</p>}
        <button disabled={pending} className="w-full rounded-md bg-(--color-amf-plum) px-4 py-3 font-medium text-white disabled:opacity-50">{pending ? 'Aguarde…' : title}</button>
      </>}
    </form>
    <Link href="/entrar" className="mt-6 block text-center text-sm text-(--color-amf-teal) underline">Voltar para entrar</Link>
    {mode === 'reset' && <Link href="/recuperar-senha" className="mt-3 block text-center text-sm underline">Solicitar outro link</Link>}
  </div></main>;
}


