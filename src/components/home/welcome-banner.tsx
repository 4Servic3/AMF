'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface WelcomeBannerProps {
  imageUrl: string;
  href?: string;
  alt?: string;
}

export function WelcomeBanner({ imageUrl, href, alt = 'Boas-vindas à área de membros' }: WelcomeBannerProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="w-full flex items-center justify-center p-4 bg-[#1C0D29]/50 rounded-[18px] border border-[#D4AD62]/10 mt-3 sm:mt-4 mb-6 sm:mb-7 aspect-[2/1] text-sm text-[#D4AD62]/70">
        Não foi possível carregar o banner.
      </div>
    );
  }

  const content = (
    <div className="relative w-full rounded-[18px] sm:rounded-[20px] overflow-hidden bg-[#160B24] border border-[rgba(224,193,126,0.15)] shadow-[0_8px_24px_rgba(17,15,24,0.3)] mt-0 mb-6 sm:mb-7 mx-auto max-w-[1240px]" style={{ aspectRatio: '2/1', width: 'calc(100% - 32px)' }}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        sizes="(max-width: 493px) calc(100vw - 32px), (max-width: 768px) calc(100vw - 32px), 1240px"
        className="object-cover object-center"
        priority
        onError={() => setHasError(true)}
      />
    </div>
  );

  if (href && href !== '#') {
    return (
      <Link href={href} className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AD62] rounded-[18px] sm:rounded-[20px] transition-transform hover:scale-[1.01]">
        {content}
      </Link>
    );
  }

  return content;
}
