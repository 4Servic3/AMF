'use client';

import dynamic from 'next/dynamic';

export const PdfViewer = dynamic(
  () => import('./pdf-viewer-content').then(module => module.PdfViewerContent),
  {
    ssr: false,
    loading: () => <div className="flex h-[calc(100dvh-210px)] min-h-[440px] w-full items-center justify-center bg-[#EFEAF3] text-sm text-[#7A6E86] lg:h-[calc(100dvh-150px)]" role="status">Preparando o visualizador de PDF…</div>,
  },
);
