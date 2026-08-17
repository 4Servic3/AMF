import React from 'react';
import Link from 'next/link';

interface PaywallProps {
  title: string;
  description: string;
  imageUrl?: string;
  themeColor?: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function Paywall({
  title,
  description,
  imageUrl,
  themeColor = '#4E887F',
  ctaText = 'Desbloquear Acesso',
  ctaUrl = '/comprar'
}: PaywallProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-(--color-amf-border) max-w-lg w-full text-center">
      <div 
        className="w-16 h-16 rounded-full mb-6 flex items-center justify-center"
        style={{ backgroundColor: `${themeColor}20`, color: themeColor }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      </div>
      
      <h3 className="text-xl font-editorial font-bold text-(--color-amf-plum) mb-3">
        {title}
      </h3>
      <p className="text-(--color-amf-muted) text-sm mb-8">
        {description}
      </p>

      <Link
        href={ctaUrl}
        className="w-full rounded-md py-3 font-medium text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: themeColor }}
      >
        {ctaText}
      </Link>
    </div>
  );
}
