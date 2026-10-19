'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PdfViewerProps {
  courseSlug: string;
  materialId: string;
  title: string;
  onClose?: () => void;
}

export function PdfViewerContent({ courseSlug, materialId, title, onClose }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageWidth, setPageWidth] = useState<number | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const viewUrl = `/api/courses/${encodeURIComponent(courseSlug)}/material/${encodeURIComponent(materialId)}/view`;
  const downloadUrl = `/api/courses/${encodeURIComponent(courseSlug)}/material/${encodeURIComponent(materialId)}/download`;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setPageWidth(Math.max(240, Math.min(element.clientWidth - 32, 1000)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  function retry() {
    setError(false);
    setLoading(true);
    setNumPages(null);
    setPageNumber(1);
    setAttempt(value => value + 1);
  }

  return (
    <section aria-label={`Visualizador: ${title}`} className="relative flex h-[calc(100dvh-64px)] min-h-[420px] w-full flex-col overflow-hidden bg-gray-100">
      <header className="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white p-3 shadow-sm sm:p-4">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          {onClose && <button type="button" onClick={onClose} className="-ml-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-[#0F6466]" aria-label="Voltar à aula"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg></button>}
          <h2 className="truncate text-sm font-bold text-[#160820] sm:max-w-md sm:text-base">{title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {numPages && <span className="hidden text-sm font-medium text-gray-500 sm:inline">{pageNumber} / {numPages}</span>}
          <a href={downloadUrl} download className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#D4AD62] px-3 py-2 text-sm font-bold text-[#160820] shadow-sm transition-colors hover:bg-[#c29c54] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6466]" aria-label={`Baixar ${title}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>
            <span>Baixar</span>
          </a>
        </div>
      </header>

      <div ref={containerRef} className="relative flex min-h-0 flex-1 justify-center overflow-auto bg-gray-500/10 px-4 py-5">
        {loading && !error && <div className="absolute inset-0 z-10 flex items-center justify-center" role="status"><span className="h-8 w-8 animate-spin rounded-full border-4 border-[#0F6466] border-t-transparent"/><span className="sr-only">Carregando PDF…</span></div>}
        {error ? <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600" aria-hidden="true">!</div>
          <p className="font-bold text-gray-800">Falha ao carregar o PDF</p>
          <p className="mt-1 text-sm text-gray-500">Verifique sua conexão e tente novamente.</p>
          <button type="button" onClick={retry} className="mt-4 min-h-11 rounded-full bg-[#0F6466] px-5 py-2 text-sm font-bold text-white">Tentar novamente</button>
        </div> : <Document key={attempt} file={viewUrl} onLoadSuccess={({ numPages: count }) => { setNumPages(count); setLoading(false); }} onLoadError={() => { setError(true); setLoading(false); }} className="h-max rounded-sm bg-white shadow-xl">
          {pageWidth && <Page pageNumber={pageNumber} width={pageWidth} renderTextLayer renderAnnotationLayer onRenderError={() => { setError(true); setLoading(false); }} />}
        </Document>}
        {numPages && numPages > 1 && !error && <nav aria-label="Páginas do PDF" className="sticky bottom-3 z-20 mt-auto flex h-12 shrink-0 items-center gap-3 self-end rounded-full border border-gray-200 bg-white/95 px-4 shadow-lg backdrop-blur-sm">
          <button type="button" disabled={pageNumber <= 1} onClick={() => setPageNumber(value => Math.max(1, value - 1))} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-30" aria-label="Página anterior">‹</button>
          <span className="min-w-14 text-center text-sm font-bold text-gray-700">{pageNumber} / {numPages}</span>
          <button type="button" disabled={pageNumber >= numPages} onClick={() => setPageNumber(value => Math.min(numPages, value + 1))} className="flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 disabled:opacity-30" aria-label="Próxima página">›</button>
        </nav>}
      </div>
    </section>
  );
}
