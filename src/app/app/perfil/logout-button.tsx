'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    // Dialog simples nativo (para não usar dark patterns ou demorar implementando modals complexos)
    const confirmed = window.confirm('Tem certeza que deseja sair da sua conta?');
    if (!confirmed) return;

    setLoading(true);

    try {
      // Simulação de chamada de API para invalidar sessão/limpar cache
      await new Promise((resolve) => setTimeout(resolve, 800));
      // Redireciona de forma segura usando o router do Next
      router.push('/');
      router.refresh();
    } catch (err) {
      console.error('Erro ao sair da conta:', err);
      alert('Não foi possível sair da conta no momento.');
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="text-[#D93030] font-bold text-[14px] hover:underline active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D93030] rounded-sm px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Saindo...' : 'Sair da conta'}
    </button>
  );
}
