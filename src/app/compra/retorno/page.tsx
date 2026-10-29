import React from 'react';
import Link from 'next/link';

export const metadata = { title: 'Compra recebida | AMF' };

export default function RetornoCompraPage() {
  return (
    <div className="min-h-screen bg-(--color-amf-bg) flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-(--color-amf-border) p-8 text-center">
        
        <h1 className="text-2xl font-bold font-editorial text-(--color-amf-plum) mb-2">
          Obrigado pela sua compra
        </h1>

        <p className="text-(--color-amf-muted) text-sm mb-8">
          Assim que a plataforma de pagamento confirmar, o acesso é liberado na conta com o mesmo e-mail usado na compra. Pix costuma levar poucos minutos; boleto, até 3 dias úteis.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-8">
          <p className="text-xs text-left text-(--color-amf-muted)">
            Se o acesso não aparecer em <Link href="/app/perfil/assinatura" className="underline">Minhas compras</Link> depois da confirmação, fale com o <Link href="/app/perfil/suporte" className="underline">suporte</Link> informando o e-mail da compra.
          </p>
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
