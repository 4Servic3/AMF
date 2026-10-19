'use client';

import dynamic from 'next/dynamic';

export const PdfViewer = dynamic(
  () => import('./pdf-viewer-content').then(module => module.PdfViewerContent),
  {
    ssr: false,
    loading: () => <div className="flex h-[calc(100dvh-64px)] min-h-[420px] items-center justify-center bg-gray-100 text-sm text-gray-600" role="status">Preparando o visualizador de PDF…</div>,
  },
);
