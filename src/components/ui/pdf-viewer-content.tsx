'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Download, Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

interface PdfViewerProps {
  courseSlug: string;
  materialId: string;
  title: string;
  onClose?: () => void;
}

const SWIPE_MIN_PX = 48;
const STAGE_PADDING = 24;

/** Largura que faz a página caber inteira no palco, pela largura e pela altura. */
export function fitPageWidth(stage: { width: number; height: number }, aspect: number, padding = STAGE_PADDING) {
  const maxW = Math.max(160, stage.width - padding * 2);
  const maxH = Math.max(160, stage.height - padding * 2);
  return Math.floor(Math.min(maxW, maxH * aspect));
}

export function PdfViewerContent({ courseSlug, materialId, title, onClose }: PdfViewerProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  const [stage, setStage] = useState<{ width: number; height: number } | null>(null);
  const [aspect, setAspect] = useState<number | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const viewUrl = `/api/courses/${encodeURIComponent(courseSlug)}/material/${encodeURIComponent(materialId)}/view`;
  const downloadUrl = `/api/courses/${encodeURIComponent(courseSlug)}/material/${encodeURIComponent(materialId)}/download`;

  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const measure = () => setStage({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [fullscreen]);

  const go = useCallback((delta: 1 | -1) => {
    if (!numPages) return;
    setPageNumber(current => {
      const next = Math.min(numPages, Math.max(1, current + delta));
      if (next !== current) setDirection(delta > 0 ? 'next' : 'prev');
      return next;
    });
  }, [numPages]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.key === 'ArrowRight' || event.key === 'PageDown') go(1);
      else if (event.key === 'ArrowLeft' || event.key === 'PageUp') go(-1);
      else if (event.key === 'Escape') setFullscreen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  useEffect(() => {
    if (!fullscreen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [fullscreen]);

  function retry() {
    setError(false);
    setLoading(true);
    setNumPages(null);
    setAspect(null);
    setPageNumber(1);
    setAttempt(value => value + 1);
  }

  function onPointerDown(event: React.PointerEvent) {
    swipeStart.current = { x: event.clientX, y: event.clientY };
  }
  function onPointerUp(event: React.PointerEvent) {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
  }

  const pageWidth = stage && aspect ? fitPageWidth(stage, aspect) : null;
  const progress = numPages ? (pageNumber / numPages) * 100 : 0;

  return (
    <section
      aria-label={`Visualizador: ${title}`}
      className={fullscreen
        ? 'fixed inset-0 z-[100] flex flex-col bg-[#EFEAF3]'
        : 'amf-pdf-viewer relative flex h-[calc(100dvh-210px)] min-h-[440px] w-full flex-col overflow-hidden bg-[#EFEAF3] lg:h-[calc(100dvh-150px)]'}
    >
      <header className="z-10 flex shrink-0 items-center justify-between gap-3 border-b border-[#E3DCEA] bg-white/85 px-3 py-2.5 backdrop-blur-xl sm:px-4">
        <div className="flex min-w-0 items-center gap-2">
          {(onClose || fullscreen) && (
            <button
              type="button"
              onClick={() => (fullscreen ? setFullscreen(false) : onClose?.())}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#5B4A6B] hover:bg-[#F3EEF7] focus-visible:outline-2 focus-visible:outline-[#7C4DBB]"
              aria-label={fullscreen ? 'Sair da tela cheia' : 'Voltar à aula'}
            >
              <ArrowLeft size={20} aria-hidden="true" />
            </button>
          )}
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[#1C0D29] sm:text-[15px]">{title}</h2>
            {numPages && <p className="text-xs text-[#7A6E86]">Página {pageNumber} de {numPages}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <a
            href={downloadUrl}
            download
            className="inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-semibold text-[#7C4DBB] hover:bg-[#F3EEF7] focus-visible:outline-2 focus-visible:outline-[#7C4DBB]"
            aria-label={`Baixar ${title}`}
          >
            <Download size={18} aria-hidden="true" />
            <span className="hidden sm:inline">Baixar</span>
          </a>
          <button
            type="button"
            onClick={() => setFullscreen(value => !value)}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[#7C4DBB] px-3.5 text-sm font-semibold text-white hover:bg-[#6A3FA3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C4DBB]"
            aria-pressed={fullscreen}
          >
            {fullscreen ? <Minimize2 size={17} aria-hidden="true" /> : <Maximize2 size={17} aria-hidden="true" />}
            <span>{fullscreen ? 'Sair' : 'Tela cheia'}</span>
          </button>
        </div>
      </header>
      {numPages && numPages > 1 && (
        <div className="h-0.5 w-full shrink-0 bg-[#E3DCEA]" aria-hidden="true">
          <div className="h-full bg-[#7C4DBB] transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 touch-pan-y select-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { swipeStart.current = null; }}
      >
        {loading && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" role="status">
            <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#7C4DBB] border-t-transparent" />
            <span className="sr-only">Carregando PDF…</span>
          </div>
        )}
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600" aria-hidden="true">!</div>
            <p className="font-bold text-gray-800">Falha ao carregar o PDF</p>
            <p className="mt-1 text-sm text-gray-500">Verifique sua conexão e tente novamente.</p>
            <button type="button" onClick={retry} className="mt-4 min-h-11 rounded-full bg-[#7C4DBB] px-5 py-2 text-sm font-bold text-white">Tentar novamente</button>
          </div>
        ) : (
          <Document
            key={attempt}
            file={viewUrl}
            loading={null}
            onLoadSuccess={async (pdf) => {
              setNumPages(pdf.numPages);
              try {
                const first = await pdf.getPage(1);
                const viewport = first.getViewport({ scale: 1 });
                setAspect(viewport.width / viewport.height);
              } catch {
                setAspect(1 / Math.SQRT2);
              }
              setLoading(false);
            }}
            onLoadError={() => { setError(true); setLoading(false); }}
            className="flex h-full w-full items-center justify-center"
          >
            {pageWidth && (
              <div
                key={pageNumber}
                className={direction === 'next' ? 'amf-pdf-slide-next' : direction === 'prev' ? 'amf-pdf-slide-prev' : undefined}
              >
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  loading={<div style={{ width: pageWidth, height: pageWidth / (aspect || 1) }} className="rounded-md bg-white" />}
                  className="overflow-hidden rounded-md shadow-[0_10px_40px_rgba(28,13,41,.16)]"
                  renderTextLayer
                  renderAnnotationLayer
                  onRenderError={() => { setError(true); setLoading(false); }}
                />
              </div>
            )}
          </Document>
        )}

        {numPages && numPages > 1 && !error && (
          <>
            <button type="button" disabled={pageNumber <= 1} onClick={() => go(-1)} className="absolute left-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1C0D29] shadow-md backdrop-blur hover:bg-white disabled:opacity-0 sm:flex" aria-label="Página anterior">
              <ChevronLeft size={22} aria-hidden="true" />
            </button>
            <button type="button" disabled={pageNumber >= numPages} onClick={() => go(1)} className="absolute right-2 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#1C0D29] shadow-md backdrop-blur hover:bg-white disabled:opacity-0 sm:flex" aria-label="Próxima página">
              <ChevronRight size={22} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {numPages && numPages > 1 && !error && (
        <nav aria-label="Páginas do PDF" className="flex shrink-0 items-center justify-center gap-3 border-t border-[#E3DCEA] bg-white/85 px-3 py-2 pb-[max(8px,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <button type="button" disabled={pageNumber <= 1} onClick={() => go(-1)} className="flex h-11 w-11 items-center justify-center rounded-full text-[#1C0D29] hover:bg-[#F3EEF7] disabled:opacity-30" aria-label="Página anterior">
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <span className="min-w-20 text-center text-sm font-semibold tabular-nums text-[#1C0D29]" aria-live="polite">{pageNumber} / {numPages}</span>
          <button type="button" disabled={pageNumber >= numPages} onClick={() => go(1)} className="flex h-11 w-11 items-center justify-center rounded-full text-[#1C0D29] hover:bg-[#F3EEF7] disabled:opacity-30" aria-label="Próxima página">
            <ChevronRight size={22} aria-hidden="true" />
          </button>
          <span className="hidden text-xs text-[#7A6E86] sm:inline">Deslize ou use as setas do teclado</span>
        </nav>
      )}
    </section>
  );
}
