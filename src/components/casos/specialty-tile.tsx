import React from 'react';
import Image from 'next/image';

type SpecialtyTileProps = {
  title: string;
  count: number;
  imageUrl: string;
  icon: React.ReactNode;
  onOpenSpecialty: () => void;
};

export function SpecialtyTile({ title, count, imageUrl, icon, onOpenSpecialty }: SpecialtyTileProps) {
  return (
    <button
      onClick={onOpenSpecialty}
      className="relative w-[140px] sm:w-[150px] aspect-[4/5] rounded-[14px] overflow-hidden flex-none snap-start group border border-[#D9D1C4]/20 hover:border-[#D4AD62] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62] text-left"
    >
      <Image
        src={imageUrl}
        alt={title}
        fill
        className="object-cover transition-transform duration-700 group-hover:scale-105"
      />
      
      {/* Overlay escuro inferior */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      
      <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col">
        <div className="text-[#D4AD62] mb-1">
          {icon}
        </div>
        <h3 className="font-editorial font-bold text-white text-[18px] leading-tight mb-1">
          {title}
        </h3>
        <p className="font-sans font-medium text-white/80 text-[11px]">
          {count} casos
        </p>
      </div>
    </button>
  );
}
