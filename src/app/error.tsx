'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('AMF Global Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-(--color-amf-bg) flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-white p-8 rounded-2xl shadow-sm border border-(--color-amf-border)">
        <div className="w-16 h-16 mx-auto bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        </div>
        <h1 className="text-2xl font-bold font-editorial text-(--color-amf-plum) mb-2">Ops! Algo deu errado.</h1>
        <p className="text-(--color-amf-muted) mb-8">
          Encontramos um problema inesperado ao processar sua requisição. Nossa equipe técnica já foi notificada.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 bg-gray-100 text-(--color-amf-foreground) font-bold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Tentar Novamente
          </button>
          <Link
            href="/app"
            className="flex-1 bg-(--color-amf-plum) text-white font-bold py-3 px-6 rounded-lg hover:bg-(--color-amf-purple) transition-colors"
          >
            Ir para Home
          </Link>
        </div>
        {error.digest && (
          <div className="mt-8 text-xs text-gray-400">
            Error ID: {error.digest}
          </div>
        )}
      </div>
    </div>
  );
}
