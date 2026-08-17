'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { login } from './actions';

export default function Entrar() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8 bg-(--color-amf-creme)">
      <div className="w-full max-w-md bg-white rounded-[20px] shadow-sm p-8 border border-(--color-amf-border)">
        <h1 className="text-2xl font-editorial font-bold text-center text-(--color-amf-plum) mb-6">
          Acesse sua conta
        </h1>
        <form action={formAction} className="flex flex-col gap-4">
          {state?.error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md border border-red-200">
              {state.error}
            </div>
          )}
          
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-(--color-amf-foreground)">E-mail</label>
            <input 
              id="email" 
              name="email"
              type="email" 
              required
              className="w-full rounded-md border border-(--color-amf-border) p-2.5 text-sm outline-none focus:border-(--color-amf-teal) focus:ring-1 focus:ring-(--color-amf-teal)"
              placeholder="seu@email.com" 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-(--color-amf-foreground)">Senha</label>
            <input 
              id="password" 
              name="password"
              type="password" 
              required
              className="w-full rounded-md border border-(--color-amf-border) p-2.5 text-sm outline-none focus:border-(--color-amf-teal) focus:ring-1 focus:ring-(--color-amf-teal)"
              placeholder="••••••••" 
            />
          </div>
          
          <button 
            type="submit"
            disabled={pending}
            className="mt-4 w-full rounded-md bg-(--color-amf-plum) py-3 text-white font-medium hover:bg-(--color-amf-purple) transition-colors disabled:opacity-50"
          >
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-(--color-amf-muted)">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="text-(--color-amf-teal) hover:underline font-medium">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  );
}
