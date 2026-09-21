"use client";
import Link from 'next/link';
export default function PlanilhaError({ reset }: { reset: () => void }) {
  return <div className="mx-auto max-w-xl rounded-2xl border border-[#DDD5C4] bg-white p-6">
    <h2 className="text-xl font-semibold">Não foi possível abrir a planilha</h2>
    <p className="mt-3 text-sm">Tente novamente em instantes.</p>
    <button onClick={reset} className="mt-5 min-h-11 rounded-xl bg-[#1F5F54] px-5 text-sm font-semibold text-white">Tentar novamente</button>
    <Link href="/app" className="ml-4 inline-flex min-h-11 items-center text-sm underline">Voltar ao início</Link>
  </div>;
}
