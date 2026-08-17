'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { X, LockKeyhole } from 'lucide-react';
import { StoryCollection } from '@/lib/models/stories';

interface StoryViewerProps {
  collection: StoryCollection;
  initialIndex?: number;
  onClose: () => void;
  hasAccess: boolean;
}

export function StoryViewer({ collection, initialIndex = 0, onClose, hasAccess }: StoryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [imageFit, setImageFit] = useState<'cover' | 'contain'>('cover');

  const currentItem = collection.items[currentIndex];

  // Determinar aspecto/fit quando a imagem carrega
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (currentItem.fit) {
      setImageFit(currentItem.fit);
      return;
    }
    const img = e.currentTarget;
    const ratio = img.naturalWidth / img.naturalHeight;
    // Se a imagem for mais horizontal ou perfeitamente quadrada, usar contain
    if (ratio > 0.8) {
      setImageFit('contain');
    } else {
      setImageFit('cover');
    }
  };

  const handleNext = useCallback(() => {
    if (currentIndex < collection.items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onClose(); // Terminou a coleção
    }
  }, [currentIndex, collection.items.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Interceptar acesso (Paywall) derivado durante o render para evitar efeitos em cascata
  const isCurrentlyLocked = !currentItem.is_free && !hasAccess;

  useEffect(() => {
    if (isCurrentlyLocked) {
      setShowPaywall(true);
      setIsPaused(true);
    } else {
      setShowPaywall(false);
      setIsPaused(false);
      setProgress(0);
    }
  }, [isCurrentlyLocked]);

  // Timer de progresso automático (8s padrão para imagens)
  useEffect(() => {
    if (showPaywall || isPaused || currentItem.media_type === 'video') return;

    const interval = 50; // ms
    const totalTime = (currentItem.duration_seconds || 8) * 1000;
    const step = (interval / totalTime) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          handleNext();
          return 100;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, showPaywall, currentItem, handleNext]);

  // Pause on visibility change
  useEffect(() => {
    const handleVisibility = () => setIsPaused(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') setIsPaused(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (showPaywall) return;
    setIsPaused(true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (showPaywall) return;
    setIsPaused(false);
    
    // Tap para anterior/próximo
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    if (x < rect.width * 0.3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#07080B] flex items-center justify-center md:bg-[#07080B]/95 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Story Viewer - ${collection.title}`}
    >
      
      {/* Desktop Wrapper / Mobile Fullscreen */}
      <div className="relative w-full h-[100dvh] md:w-full md:max-w-[440px] md:h-[calc(100dvh-32px)] md:rounded-[24px] overflow-hidden bg-[#160B24] flex flex-col md:border md:border-white/10 shadow-2xl">
        
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 p-3 pt-[calc(env(safe-area-inset-top)+12px)] flex gap-[4px] z-30">
          {collection.items.map((item, i) => (
            <div key={item.id} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-75 ease-linear"
                style={{ 
                  width: i < currentIndex ? '100%' : i === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header Controls */}
        <div className="absolute top-0 left-0 right-0 pt-[calc(env(safe-area-inset-top)+24px)] px-4 z-30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-sans font-bold text-[13px] tracking-wide drop-shadow-md">
              {currentItem.category || collection.title}
            </span>
            {currentItem.is_new && (
              <span className="bg-[#FF7068] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                NOVO
              </span>
            )}
          </div>
          
          <button 
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* Media Container */}
        <div 
          className="relative flex-1 w-full h-full"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => !showPaywall && setIsPaused(false)}
        >
          {currentItem.media_type === 'image' && !showPaywall && (
            <>
              {/* Blurred Background for Contain images */}
              {imageFit === 'contain' && (
                <div className="absolute inset-0 z-0">
                  <Image
                    src={currentItem.media_url}
                    alt=""
                    fill
                    className="object-cover blur-2xl opacity-40 scale-110"
                  />
                  <div className="absolute inset-0 bg-[#0E5B5C]/20" />
                </div>
              )}

              {/* Main Image */}
              <Image
                src={currentItem.media_url}
                alt={currentItem.title || "Story content"}
                fill
                priority
                className={`z-10 ${imageFit === 'contain' ? 'object-contain' : 'object-cover'} object-center`}
                onLoad={handleImageLoad}
              />

              {/* Bottom Gradient for Text Legibility */}
              <div 
                className="absolute inset-x-0 bottom-0 h-1/2 z-20 pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.36) 42%, transparent 72%)'
                }}
              />

              {/* Text Overlay */}
              <div className="absolute inset-x-0 bottom-0 p-5 pb-[calc(env(safe-area-inset-bottom)+24px)] z-30 pointer-events-none flex flex-col justify-end">
                {currentItem.title && (
                  <h2 className="font-editorial font-bold text-white text-[24px] sm:text-[26px] leading-tight mb-2">
                    {currentItem.title}
                  </h2>
                )}
                {currentItem.caption && (
                  <p className="font-sans text-white/90 text-[14px] leading-snug line-clamp-3">
                    {currentItem.caption}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Paywall Overlay */}
          {showPaywall && (
            <div className="absolute inset-0 z-40 bg-[#160B24] flex flex-col items-center justify-center p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-[#D4AD62]/20 text-[#D4AD62] flex items-center justify-center mb-6">
                <LockKeyhole size={28} strokeWidth={2} />
              </div>
              <h2 className="text-2xl font-editorial font-bold text-white mb-2">
                Continue acompanhando este caso
              </h2>
              <p className="text-white/70 mb-8 text-sm font-sans">
                Veja os exames, o raciocínio clínico, o diagnóstico e a conduta completa.
              </p>
              
              <button className="w-full bg-[#D4AD62] text-[#14091F] font-sans font-bold py-3.5 rounded-full hover:bg-[#E0C17E] transition-colors">
                Desbloquear Acesso
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
