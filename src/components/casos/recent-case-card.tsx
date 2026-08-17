import React from 'react';
import Image from 'next/image';
import { ChevronRight, Bookmark } from 'lucide-react';

type RecentCaseCardProps = {
  imageUrl: string;
  category: string;
  title: string;
  metadata: string;
  status?: 'new';
  hasBookmark?: boolean;
  onOpenCase: () => void;
};

export function RecentCaseCard({ imageUrl, category, title, metadata, status, hasBookmark, onOpenCase }: RecentCaseCardProps) {
  return (
    <button 
      onClick={onOpenCase}
      className="w-full grid grid-cols-[minmax(90px,28%)_minmax(0,1fr)] sm:grid-cols-[minmax(110px,25%)_minmax(0,1fr)] rounded-[16px] overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#D9D1C4]/60 text-left hover:border-[#D4AD62] hover:shadow-md transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62] group min-w-0"
    >
      {/* Imagem */}
      <div className="relative w-full h-[100px] sm:h-[110px] min-w-0">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>

      {/* Conteúdo */}
      <div className="flex flex-col justify-center w-full h-full p-3 sm:p-4 min-w-0 bg-[#FAF7F1]/40">
        <div className="flex justify-between items-start mb-1 min-w-0 gap-2">
          <div className="font-sans font-bold text-[#68727E] text-[10px] sm:text-[11px] uppercase tracking-wider truncate">
            {category}
          </div>
          
          {/* Status ou Bookmark */}
          {status === 'new' && (
            <div className="font-sans font-bold text-[#FF7068] text-[9px] sm:text-[10px] uppercase tracking-wider bg-[#FF7068]/10 px-1.5 py-0.5 rounded-sm shrink-0">
              NOVO
            </div>
          )}
          {hasBookmark && (
            <Bookmark size={14} className="text-[#68727E] shrink-0" strokeWidth={2} />
          )}
        </div>
        
        <h3 className="font-sans font-bold text-[#172638] text-[14px] sm:text-[15px] leading-tight line-clamp-2 sm:line-clamp-3 mb-1.5 min-w-0 break-words whitespace-normal overflow-wrap-anywhere">
          {title}
        </h3>
        
        <div className="flex justify-between items-center mt-auto min-w-0 gap-2">
          <p className="font-sans font-medium text-[#68727E] text-[11px] sm:text-[12px] truncate">
            {metadata}
          </p>
          <ChevronRight size={16} className="text-[#D4AD62] shrink-0" strokeWidth={2} />
        </div>
      </div>
    </button>
  );
}
