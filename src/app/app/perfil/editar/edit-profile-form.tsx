'use client';

import React, { useState } from 'react';
import { Camera, Save, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface EditProfileFormProps {
  initialData: {
    displayName: string;
    profession: string;
    phone: string;
    initials: string;
  };
}

export function EditProfileForm({ initialData }: EditProfileFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // Simulação de chamada de API
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // Sucesso
      router.push('/app/perfil');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro ao salvar o perfil.');
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      
      {/* Avatar Section */}
      <div className="flex flex-col items-center justify-center py-4">
        <div className="relative">
          <div className="w-[100px] h-[100px] rounded-full bg-[#003D3F] flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-sm overflow-hidden">
            {formData.initials}
          </div>
          <button type="button" className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-[#E7B64F] flex items-center justify-center text-white border-2 border-white shadow-sm hover:scale-105 active:scale-95 transition-transform" aria-label="Alterar foto">
            <Camera size={18} strokeWidth={2} className="text-[#160820]" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[12px] bg-red-50 border border-red-200 text-red-700 text-[14px]">
          {error}
        </div>
      )}

      {/* Fields */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="text-[13px] font-bold text-[#14172A]">Nome de exibição</label>
          <input 
            type="text" 
            id="displayName"
            name="displayName"
            value={formData.displayName}
            onChange={handleChange}
            required
            className="w-full h-[48px] px-4 rounded-[12px] border border-[#DED5C8] bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#003D3F] focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="profession" className="text-[13px] font-bold text-[#14172A]">Profissão</label>
          <input 
            type="text" 
            id="profession"
            name="profession"
            value={formData.profession}
            onChange={handleChange}
            className="w-full h-[48px] px-4 rounded-[12px] border border-[#DED5C8] bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#003D3F] focus:border-transparent transition-shadow"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className="text-[13px] font-bold text-[#14172A]">Telefone</label>
          <input 
            type="tel" 
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full h-[48px] px-4 rounded-[12px] border border-[#DED5C8] bg-white text-[15px] focus:outline-none focus:ring-2 focus:ring-[#003D3F] focus:border-transparent transition-shadow"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-end gap-4 border-t border-[#DED5C8] pt-6">
        <Link 
          href="/app/perfil"
          className="h-[48px] px-6 rounded-full flex items-center justify-center font-bold text-[14px] text-[#657080] hover:bg-gray-100 transition-colors"
        >
          Cancelar
        </Link>
        <button 
          type="submit"
          disabled={loading}
          className="h-[48px] px-8 rounded-full flex items-center justify-center gap-2 font-bold text-[14px] text-white bg-[#003D3F] hover:bg-[#0E5B5C] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          ) : (
            <>
              <Save size={18} strokeWidth={2} />
              Salvar alterações
            </>
          )}
        </button>
      </div>

    </form>
  );
}
