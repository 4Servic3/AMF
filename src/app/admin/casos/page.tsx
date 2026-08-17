import React from 'react';
import Link from 'next/link';

// Mock DB
async function getAdminCases() {
  return [
    {
      id: 'grp00001',
      title: 'Obstrução Uretral em Felino Jovem',
      category: 'Doença Renal Crônica',
      status: 'published',
      published_at: new Date().toLocaleDateString('pt-BR'),
      item_count: 4,
      author: 'Dra. Polyana'
    },
    {
      id: 'grp00002',
      title: 'Diabetes Mellitus - Caso Clínico',
      category: 'Endocrinologia',
      status: 'draft',
      published_at: '-',
      item_count: 0,
      author: 'Dra. Polyana'
    }
  ];
}

export default async function AdminCasosPage() {
  const casos = await getAdminCases();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-(--color-amf-plum)">Casos da Semana</h1>
          <p className="text-(--color-amf-muted) mt-1">Gerencie os stories e casos clínicos.</p>
        </div>
        
        <Link href="/admin/casos/novo" className="bg-(--color-amf-teal) text-white px-5 py-2.5 rounded-lg font-bold hover:bg-(--color-amf-teal-dark) transition-colors flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Novo Caso
        </Link>
      </div>

      <div className="bg-white border border-(--color-amf-border) rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-(--color-amf-border) text-sm text-(--color-amf-muted)">
              <th className="p-4 font-medium">Título</th>
              <th className="p-4 font-medium">Categoria</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Itens</th>
              <th className="p-4 font-medium">Data Pub.</th>
              <th className="p-4 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {casos.map(caso => (
              <tr key={caso.id} className="border-b border-(--color-amf-border) last:border-0 hover:bg-gray-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-(--color-amf-foreground)">{caso.title}</div>
                  <div className="text-xs text-(--color-amf-muted)">{caso.author}</div>
                </td>
                <td className="p-4">
                  <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md text-xs font-medium">
                    {caso.category}
                  </span>
                </td>
                <td className="p-4">
                  {caso.status === 'published' ? (
                    <span className="flex items-center gap-1.5 text-(--color-amf-teal-dark)">
                      <span className="w-2 h-2 rounded-full bg-(--color-amf-teal)"></span> Publicado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-gray-500">
                      <span className="w-2 h-2 rounded-full bg-gray-300"></span> Rascunho
                    </span>
                  )}
                </td>
                <td className="p-4 text-(--color-amf-muted)">{caso.item_count} telas</td>
                <td className="p-4 text-(--color-amf-muted)">{caso.published_at}</td>
                <td className="p-4 text-right">
                  <button className="text-(--color-amf-purple) hover:underline font-medium text-sm">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
