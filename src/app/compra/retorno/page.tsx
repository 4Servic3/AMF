import React from 'react';
import Link from 'next/link';

export default function RetornoCompraPage() {
  return (
    <div className="min-h-screen bg-(--color-amf-bg) flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-(--color-amf-border) p-8 text-center">
        
        {/* Loading Animation */}
        <div className="w-16 h-16 mx-auto mb-6 relative">
          <div className="absolute inset-0 rounded-full border-4 border-(--color-amf-border)"></div>
          <div className="absolute inset-0 rounded-full border-4 border-(--color-amf-teal) border-t-transparent animate-spin"></div>
        </div>

        <h1 className="text-2xl font-bold font-editorial text-(--color-amf-plum) mb-2">
          Confirmando Pagamento
        </h1>
        
        <p className="text-(--color-amf-muted) text-sm mb-8">
          Aguarde um instante. Estamos verificando a liberação do seu acesso junto ao provedor de pagamentos.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3 text-left">
            <svg className="text-(--color-amf-teal) mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <p className="text-xs text-(--color-amf-muted)">
              Se você pagou via Pix, a confirmação geralmente leva menos de 1 minuto. Boletos podem levar até 3 dias úteis.
            </p>
          </div>
        </div>

        <Link 
          href="/app" 
          className="inline-block bg-(--color-amf-plum) text-white font-bold py-3 px-6 rounded-lg w-full hover:bg-(--color-amf-purple) transition-colors"
        >
          Ir para minha Academia
        </Link>
      </div>
    </div>
  );
}
