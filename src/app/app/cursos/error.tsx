'use client';

import React from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col w-full min-h-[500px] items-center justify-center bg-(--color-amf-creme) p-6">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 text-center border border-(--color-amf-border) shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
        </div>
        <h2 className="text-xl font-editorial font-bold text-(--color-amf-plum) mb-2">
          Não foi possível carregar os cursos
        </h2>
        <p className="text-sm text-(--color-amf-muted) mb-6">
          Tivemos um problema de conexão ou interno ao tentar buscar as informações da biblioteca. 
          {error.message && <span className="block mt-2 text-xs opacity-70">{error.message}</span>}
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-2.5 rounded-xl bg-(--color-amf-teal) text-white font-bold hover:bg-(--color-amf-teal-dark) transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
