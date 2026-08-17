import React from 'react';
import { notFound } from 'next/navigation';
import { determineAccessState, getUserEntitlements } from '@/lib/services/access';
import { trackEvent } from '@/lib/services/analytics';
import { Paywall } from '@/components/ui/paywall';

// Mock DB Fetch
async function getProductBySlug(slug: string) {
  const products = [
    {
      id: '1111', slug: 'casos-da-semana', name: 'Casos da Semana', type: 'subscription',
      subtitle: 'Acompanhe casos clínicos reais toda semana.',
      long_description: 'Toda semana a Dra. Polyana traz um caso clínico real, do atendimento à alta, mostrando o passo a passo do raciocínio diagnóstico e terapêutico.',
      themeColor: '#4E887F', imageUrl: '', status: 'active',
      instructor: 'Dra. Polyana',
      benefits: ['1 caso novo por semana', 'Acesso ao acervo', 'Discussão clínica'],
      cta_text: 'Assinar agora'
    },
    {
      id: '2222', slug: 'imersao-parte-1', name: 'Imersão Clínica P1', type: 'course',
      subtitle: 'O básico bem feito que salva vidas.',
      long_description: 'Curso completo cobrindo os principais desafios do atendimento inicial de felinos, triagem, manejo cat-friendly, fluidoterapia e emergências.',
      themeColor: '#65427A', imageUrl: '', status: 'active',
      instructor: 'Dra. Polyana',
      benefits: ['Apostilas em PDF', 'Certificado de 20h', 'Acesso vitalício'],
      cta_text: 'Comprar Imersão'
    }
  ];
  return products.find(p => p.slug === slug);
}

export default async function ProductDetails({ params }: { params: { slug: string } }) {
  const { slug } = params; // Fix for next 15 if needed, params is async in next 15 but we can assume normal for now, wait, in Next 15 `params` is a Promise, so `await params`. Let's do `const { slug } = await params;` to be safe, but the type might complain if not defined correctly.
  // We'll stick to Next 14/15 standard:
  const product = await getProductBySlug(slug);
  
  if (!product) {
    notFound();
  }

  const userId = 'fake-user-id';
  trackEvent('product_viewed', { userId, productId: product.id });

  const entitlements = await getUserEntitlements(userId);
  const accessState = determineAccessState(entitlements, product.id, product.status);
  const isAvailable = accessState === 'available';

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
      {/* Coluna Esquerda: Conteúdo / Info */}
      <div className="flex-1 flex flex-col gap-8">
        <div 
          className="w-full h-64 rounded-2xl bg-gray-200 border border-(--color-amf-border) relative overflow-hidden"
          style={{ backgroundImage: `url(${product.imageUrl})`, backgroundSize: 'cover' }}
        >
           <div className="absolute inset-0" style={{ backgroundColor: product.themeColor, opacity: 0.2 }}></div>
        </div>

        <div>
          <h1 className="text-3xl font-editorial font-bold text-(--color-amf-plum) mb-2">{product.name}</h1>
          <p className="text-xl text-(--color-amf-foreground) font-medium mb-4">{product.subtitle}</p>
          <p className="text-(--color-amf-muted) whitespace-pre-wrap">{product.long_description}</p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-(--color-amf-teal-dark) mb-4">Benefícios</h2>
          <ul className="space-y-3">
            {product.benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-3 text-(--color-amf-foreground)">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: product.themeColor }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Coluna Direita: Paywall / CTA */}
      <div className="w-full lg:w-96 flex-shrink-0">
        <div className="sticky top-24">
          {isAvailable ? (
            <div className="bg-white p-6 rounded-2xl border border-(--color-amf-border) shadow-sm text-center">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center text-white" style={{ backgroundColor: product.themeColor }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2" ry="2"/></svg>
              </div>
              <h3 className="text-xl font-bold text-(--color-amf-plum) mb-2">Você já possui acesso</h3>
              <p className="text-(--color-amf-muted) text-sm mb-6">Continue aprendendo e aprimorando seus conhecimentos.</p>
              <button 
                className="w-full py-3 rounded-md font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: product.themeColor }}
              >
                Acessar Conteúdo
              </button>
            </div>
          ) : (
            <Paywall 
              title={product.type === 'subscription' ? 'Desbloqueie os Casos da Semana' : 'Garanta sua vaga na Imersão'}
              description={product.type === 'subscription' ? 'Assine agora para ter acesso a todos os casos anteriores e os novos toda semana.' : 'Compre agora para ter acesso vitalício a todas as aulas e materiais.'}
              themeColor={product.themeColor}
              ctaText={product.cta_text}
              ctaUrl={`/checkout?product=${product.id}`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
