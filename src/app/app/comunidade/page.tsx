import React from 'react';
import Link from 'next/link';
import { determineAccessState, getUserEntitlements } from '@/lib/services/access';

export default async function ComunidadePage() {
  const userId = '00000000-0000-0000-0000-000000000000'; // Mock for MVP
  const entitlements = await getUserEntitlements(userId);
  
  // Apenas quem possui o produto 'Academia Completa' ou algo específico tem acesso ao WhatsApp
  const bundleProductId = '4444'; // Id correspondente ao bundle
  const hasAccess = determineAccessState(entitlements, bundleProductId) === 'available';

  const whatsappLink = process.env.NEXT_PUBLIC_COMMUNITY_URL || '#';

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-(--color-amf-plum)">Comunidade</h1>
          <p className="text-(--color-amf-muted) mt-1">Networking e discussão clínica de alto nível.</p>
        </div>
      </div>

      <div className="bg-white border border-(--color-amf-border) rounded-2xl shadow-sm overflow-hidden">
        <div className="p-8 text-center bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="w-16 h-16 mx-auto bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          </div>
          <h2 className="text-2xl font-bold font-editorial text-gray-900 mb-2">Grupo Exclusivo no WhatsApp</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            A troca de experiências é fundamental na Medicina Felina. Participe do nosso grupo restrito para alunos da Academia Completa.
          </p>

          {hasAccess ? (
            <div className="space-y-4">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-block bg-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-green-600 transition-colors">
                Entrar no Grupo
              </a>
              <p className="text-xs text-gray-500">
                Lembre-se: é terminantemente proibido compartilhar dados identificáveis de tutores ou pacientes no grupo.
              </p>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-sm mx-auto">
              <div className="flex items-center gap-2 text-(--color-amf-gold) font-bold justify-center mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Acesso Restrito
              </div>
              <p className="text-sm text-gray-600 mb-4">
                O acesso à comunidade é um benefício exclusivo dos assinantes da Academia Completa.
              </p>
              <Link href="/app/produtos/academia-completa" className="block w-full text-center bg-gray-900 text-white font-bold py-2 rounded hover:bg-gray-800 transition-colors">
                Fazer Upgrade
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
