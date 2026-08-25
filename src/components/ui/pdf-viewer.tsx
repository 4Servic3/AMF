'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  courseSlug: string;
  materialId: string;
  title: string;
  onClose?: () => void;
}

export function PdfViewer({ courseSlug, materialId, title, onClose }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const viewUrl = `/api/courses/${courseSlug}/material/${materialId}/view`;
  const downloadUrl = `/api/courses/${courseSlug}/material/${materialId}/download`;

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError() {
    setError(true);
    setLoading(false);
  }

  return (
    <div className="flex flex-col w-full h-[calc(100vh-64px)] bg-gray-100 overflow-hidden relative">
      {/* Viewer Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          {onClose && (
            <button onClick={onClose} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            </button>
          )}
          <h2 className="font-bold text-[#160820] truncate max-w-[200px] sm:max-w-md">{title}</h2>
        </div>
        
        <div className="flex items-center gap-4">
          {numPages && (
            <div className="text-sm font-medium text-gray-500 hidden sm:block">
              {pageNumber} / {numPages}
            </div>
          )}
          <a 
            href={downloadUrl} 
            download
            className="flex items-center gap-2 bg-[#D4AD62] hover:bg-[#c29c54] text-[#160820] px-4 py-2 rounded-md font-bold text-sm transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            <span className="hidden sm:inline">Baixar</span>
          </a>
        </div>
      </div>

      {/* PDF Container */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-500/10 py-6 relative">
        {loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#0F6466] border-t-transparent rounded-full"></div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p className="font-bold text-gray-800">Falha ao carregar o PDF</p>
            <p className="text-sm text-gray-500 mt-1">Sua sessão pode ter expirado ou você não tem acesso.</p>
          </div>
        )}

        <Document
          file={viewUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          className="shadow-xl rounded-sm overflow-hidden bg-white"
        >
          <Page 
            pageNumber={pageNumber} 
            renderTextLayer={true}
            renderAnnotationLayer={true}
            className="max-w-full"
            width={Math.min(window.innerWidth - 32, 1000)}
          />
        </Document>
      </div>

      {/* Footer Navigation */}
      {numPages && numPages > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 rounded-full px-6 py-3 z-20">
          <button 
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(p => Math.max(1, p - 1))}
            className="p-2 text-gray-600 disabled:opacity-30 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </button>
          <span className="font-bold text-sm text-gray-700 min-w-[3rem] text-center">{pageNumber} / {numPages}</span>
          <button 
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
            className="p-2 text-gray-600 disabled:opacity-30 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </button>
        </div>
      )}
    </div>
  );
}
