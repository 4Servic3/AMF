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
      // Sign out directly via supabase client
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.signOut();

      // Clear PWA caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Clear local storages
      localStorage.clear();
      sessionStorage.clear();

      window.location.href = '/entrar';
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
