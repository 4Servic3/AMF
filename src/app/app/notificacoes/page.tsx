import React from 'react';

export default function NotificacoesPage() {
  const notificacoes = [
    {
      id: 1,
      title: 'Novo Caso da Semana',
      message: 'O caso "Obstrução Uretral em Felino Jovem" acabou de ser liberado.',
      type: 'content',
      read: false,
      date: 'Hoje, 10:00'
    },
    {
      id: 2,
      title: 'Pagamento Confirmado',
      message: 'Sua assinatura do Close Friends foi renovada com sucesso.',
      type: 'billing',
      read: true,
      date: 'Há 2 dias'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-(--color-amf-plum)">Notificações</h1>
        <button className="text-sm font-medium text-(--color-amf-teal) hover:underline">Marcar todas como lidas</button>
      </div>

      <div className="bg-white border border-(--color-amf-border) rounded-2xl shadow-sm overflow-hidden">
        {notificacoes.map(n => (
          <div key={n.id} className={`p-5 border-b border-(--color-amf-border) last:border-0 flex gap-4 ${n.read ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="mt-1">
              {n.type === 'content' && (
                 <div className="w-10 h-10 rounded-full bg-purple-100 text-(--color-amf-purple) flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                 </div>
              )}
              {n.type === 'billing' && (
                 <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                 </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-base text-(--color-amf-foreground) ${n.read ? 'font-medium' : 'font-bold'}`}>{n.title}</h3>
              <p className="text-sm text-(--color-amf-muted) mt-1">{n.message}</p>
              <div className="text-xs text-gray-400 mt-2">{n.date}</div>
            </div>
            {!n.read && (
              <div className="w-3 h-3 rounded-full bg-(--color-amf-teal) mt-2"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
