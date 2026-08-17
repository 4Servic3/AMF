import React from 'react';
import Link from 'next/link';

interface ProductCardProps {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  themeColor: string;
  status: 'locked' | 'preview' | 'available' | 'expired' | 'coming_soon';
  type: 'course' | 'subscription' | 'bundle' | 'event';
}

export function ProductCard({
  slug,
  name,
  description,
  imageUrl,
  themeColor,
  status,
  type
}: ProductCardProps) {
  const isAvailable = status === 'available';
  const isComingSoon = status === 'coming_soon';

  return (
    <div className="flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm border border-(--color-amf-border) transition-all hover:shadow-md">
      <div 
        className="h-40 w-full bg-gray-200 relative"
        style={{ backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0" style={{ backgroundColor: themeColor, opacity: 0.2 }}></div>
        {status === 'locked' && (
          <div className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full backdrop-blur-sm shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={themeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: themeColor }}>
          {type === 'subscription' ? 'Assinatura' : type === 'course' ? 'Curso' : 'Pacote'}
        </div>
        <h3 className="text-lg font-bold text-(--color-amf-foreground) mb-2">{name}</h3>
        <p className="text-sm text-(--color-amf-muted) line-clamp-2 mb-4 flex-1">
          {description}
        </p>
        
        <Link 
          href={`/app/produtos/${slug}`}
          className={`w-full py-2.5 rounded-md font-medium text-sm text-center transition-opacity ${
            isAvailable 
              ? 'text-white hover:opacity-90' 
              : isComingSoon 
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : 'bg-white border text-current hover:bg-gray-50'
          }`}
          style={isAvailable ? { backgroundColor: themeColor } : { borderColor: themeColor, color: themeColor }}
        >
          {isAvailable ? 'Acessar' : isComingSoon ? 'Em Breve' : 'Saiba mais'}
        </Link>
      </div>
    </div>
  );
}
