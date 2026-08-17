import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-6xl font-bold font-editorial text-(--color-amf-plum) mb-4">404</h1>
        <h2 className="text-2xl font-bold text-(--color-amf-foreground) mb-4">Página não encontrada</h2>
        <p className="text-(--color-amf-muted) mb-8">
          A página que você está procurando não existe, foi movida ou você não tem acesso a ela.
        </p>
        <Link
          href="/app"
          className="inline-block bg-(--color-amf-teal) text-white font-bold py-3 px-8 rounded-lg hover:bg-(--color-amf-teal-dark) transition-colors"
        >
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
