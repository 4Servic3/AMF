'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function NovoCasoPage() {
  const [step, setStep] = useState(1);
  const [checklist, setChecklist] = useState({
    namesRemoved: false,
    contactRemoved: false,
    patientIdentified: false,
    imagesReviewed: false,
    noMetadata: false,
  });

  const allChecked = Object.values(checklist).every(v => v === true);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/casos" className="w-10 h-10 rounded-full border border-(--color-amf-border) flex items-center justify-center text-(--color-amf-muted) hover:bg-white transition-colors bg-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-(--color-amf-plum)">Criar Novo Caso</h1>
          <p className="text-(--color-amf-muted) text-sm mt-1">Preencha as informações e adicione os stories.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8">
        <button 
          onClick={() => setStep(1)}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold text-center border-2 transition-colors ${step === 1 ? 'border-(--color-amf-purple) text-(--color-amf-purple) bg-white' : 'border-transparent text-(--color-amf-muted) hover:bg-gray-100'}`}
        >
          1. Informações Gerais
        </button>
        <button 
          onClick={() => setStep(2)}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold text-center border-2 transition-colors ${step === 2 ? 'border-(--color-amf-purple) text-(--color-amf-purple) bg-white' : 'border-transparent text-(--color-amf-muted) hover:bg-gray-100'}`}
        >
          2. Adicionar Telas (Stories)
        </button>
        <button 
          onClick={() => setStep(3)}
          className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold text-center border-2 transition-colors ${step === 3 ? 'border-(--color-amf-purple) text-(--color-amf-purple) bg-white' : 'border-transparent text-(--color-amf-muted) hover:bg-gray-100'}`}
        >
          3. Revisão Clínica e Publicação
        </button>
      </div>

      <div className="bg-white border border-(--color-amf-border) rounded-xl shadow-sm p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-(--color-amf-foreground)">Título do Caso</label>
                <input type="text" className="w-full border border-(--color-amf-border) rounded-lg p-3 text-sm focus:ring-2 focus:ring-(--color-amf-purple) outline-none" placeholder="Ex: Gato obstruído..." />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-(--color-amf-foreground)">Categoria</label>
                <select className="w-full border border-(--color-amf-border) rounded-lg p-3 text-sm focus:ring-2 focus:ring-(--color-amf-purple) outline-none bg-white">
                  <option>FeLV</option>
                  <option>Doença Renal Crônica</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-(--color-amf-foreground)">Resumo Clínico</label>
              <textarea className="w-full border border-(--color-amf-border) rounded-lg p-3 text-sm h-24 resize-none focus:ring-2 focus:ring-(--color-amf-purple) outline-none" placeholder="Breve descrição sobre o caso..."></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-(--color-amf-foreground)">Qtd. de Telas Gratuitas (Preview)</label>
                <input type="number" defaultValue="2" className="w-full border border-(--color-amf-border) rounded-lg p-3 text-sm focus:ring-2 focus:ring-(--color-amf-purple) outline-none" />
                <p className="text-xs text-(--color-amf-muted)">Usuários sem assinatura verão apenas esta quantidade de telas antes do paywall.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-(--color-amf-foreground)">Produto Necessário</label>
                <select className="w-full border border-(--color-amf-border) rounded-lg p-3 text-sm focus:ring-2 focus:ring-(--color-amf-purple) outline-none bg-white">
                  <option>Casos da Semana (Assinatura)</option>
                  <option>Academia Completa (Pacote)</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end pt-4 border-t border-(--color-amf-border)">
              <button onClick={() => setStep(2)} className="bg-(--color-amf-purple) text-white px-6 py-3 rounded-lg font-bold hover:bg-(--color-amf-plum) transition-colors">
                Próxima Etapa
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-10 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-white border border-(--color-amf-border) flex items-center justify-center text-(--color-amf-muted) mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              </div>
              <h3 className="font-bold text-(--color-amf-foreground) mb-1">Arraste os vídeos e imagens do caso</h3>
              <p className="text-sm text-(--color-amf-muted)">Ou clique para selecionar os arquivos. (Suporta MP4, JPG, PNG)</p>
            </div>

            <div className="space-y-3">
              {/* Fake List for MVP */}
              <div className="flex items-center gap-4 bg-white border border-(--color-amf-border) p-3 rounded-lg shadow-sm">
                <div className="text-gray-300 cursor-grab">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </div>
                <div className="w-12 h-16 bg-gray-200 rounded object-cover"></div>
                <div className="flex-1">
                  <input type="text" className="w-full text-sm font-medium outline-none border-b border-transparent focus:border-(--color-amf-teal) pb-1" defaultValue="Tela 1 (Preview)" />
                  <div className="text-xs text-(--color-amf-muted) mt-1">Vídeo • 15s • Gratuito</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-(--color-amf-border)">
              <button onClick={() => setStep(1)} className="text-(--color-amf-muted) font-medium hover:text-(--color-amf-foreground) px-4 py-2">Voltar</button>
              <button onClick={() => setStep(3)} className="bg-(--color-amf-purple) text-white px-6 py-3 rounded-lg font-bold hover:bg-(--color-amf-plum) transition-colors">
                Revisar e Publicar
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="font-bold text-red-800 flex items-center gap-2 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Checklist Clínico e Privacidade OBRIGATÓRIO
              </h3>
              
              <div className="space-y-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500" 
                    checked={checklist.namesRemoved} onChange={(e) => setChecklist({...checklist, namesRemoved: e.target.checked})} />
                  <span className="text-sm text-red-900 leading-snug">
                    <strong>Nomes Removidos:</strong> Confirmo que os nomes reais e sobrenomes dos tutores foram removidos ou ofuscados.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                    checked={checklist.contactRemoved} onChange={(e) => setChecklist({...checklist, contactRemoved: e.target.checked})} />
                  <span className="text-sm text-red-900 leading-snug">
                    <strong>Contato e Endereço:</strong> Confirmo que telefones, e-mails, documentos e endereços foram removidos (atenção às guias de exames).
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                    checked={checklist.patientIdentified} onChange={(e) => setChecklist({...checklist, patientIdentified: e.target.checked})} />
                  <span className="text-sm text-red-900 leading-snug">
                    <strong>Autorização / Paciente:</strong> Confirmo que possuo autorização para o uso didático da imagem do paciente ou que o mesmo está anonimizado na medida do possível.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                    checked={checklist.imagesReviewed} onChange={(e) => setChecklist({...checklist, imagesReviewed: e.target.checked})} />
                  <span className="text-sm text-red-900 leading-snug">
                    <strong>Revisão Criteriosa:</strong> Confirmo que assisti a todos os vídeos e li todos os textos do caso antes de tentar publicar.
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-5 h-5 rounded border-red-300 text-red-600 focus:ring-red-500"
                    checked={checklist.noMetadata} onChange={(e) => setChecklist({...checklist, noMetadata: e.target.checked})} />
                  <span className="text-sm text-red-900 leading-snug">
                    <strong>Áudio e Legendas:</strong> Confirmo que não cito dados sensíveis no áudio e legenda do caso.
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-(--color-amf-border)">
              <button onClick={() => setStep(2)} className="text-(--color-amf-muted) font-medium hover:text-(--color-amf-foreground) px-4 py-2">Voltar</button>
              
              <button 
                disabled={!allChecked}
                className={`px-6 py-3 rounded-lg font-bold transition-all ${allChecked ? 'bg-(--color-amf-teal) text-white hover:bg-(--color-amf-teal-dark) shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                Publicar Caso da Semana
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
