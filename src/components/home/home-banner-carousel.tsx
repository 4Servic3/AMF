"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

export interface HomeBannerSlide {
  id: string;
  imageUrl: string;
  href?: string;
  alt: string;
  contain?: boolean;
}

function BannerImage({ slide, first }: { slide: HomeBannerSlide; first: boolean }) {
  const [failed, setFailed] = useState(false);
  return failed ? (
    <span className="flex h-full items-center justify-center p-6 text-center text-sm text-[#E0C17E]">
      {slide.alt}
    </span>
  ) : (
    <Image
      src={slide.imageUrl}
      alt={slide.alt}
      fill
      sizes="(max-width: 768px) calc(100vw - 32px), 1240px"
      unoptimized={slide.imageUrl.startsWith("/api/")}
      preload={first}
      className={slide.contain ? "object-contain object-center" : "object-cover object-center"}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}

export function HomeBannerCarousel({ slides }: { slides: HomeBannerSlide[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const rotationBeforePointer = useRef<boolean | null>(null);
  const viewportId = "home-banner-slides";
  const count = slides.length;
  const current = count ? active % count : 0;

  useEffect(() => {
    if (count < 2 || paused || hovered) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: ReturnType<typeof setInterval> | undefined;
    const configure = () => {
      clearInterval(timer);
      if (motion.matches) return;
      timer = setInterval(() => {
        if (!document.hidden) setActive((value) => (value + 1) % count);
      }, 6500);
    };
    configure();
    motion.addEventListener("change", configure);
    return () => {
      clearInterval(timer);
      motion.removeEventListener("change", configure);
    };
  }, [count, paused, hovered]);

  function select(index: number) {
    setPaused(true);
    setActive((index + count) % count);
  }

  if (!count) return null;

  const buttonClass = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#523760] hover:bg-[#523760]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C7132]";

  return (
    <section
      aria-label="Destaques da academia"
      aria-roledescription="carrossel"
      className="w-full min-w-0 mb-6 sm:mb-7"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setPaused(true)}
    >
      <div
        id={viewportId}
        className="amf-home-banner relative mx-auto w-full max-w-[1240px] overflow-hidden rounded-[18px] border border-[rgba(224,193,126,0.15)] bg-[#160B24] shadow-[0_8px_24px_rgba(17,15,24,0.3)] sm:rounded-[20px]"
        style={{ aspectRatio: "2/1", touchAction: "pan-y" }}
        onTouchStart={(event) => {
          suppressClick.current = false;
          const touch = event.touches[0];
          touchStart.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null;
        }}
        onTouchCancel={() => { touchStart.current = null; }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          if (!start || count < 2) return;
          const touch = event.changedTouches[0];
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            suppressClick.current = true;
            select(current + (dx < 0 ? 1 : -1));
          }
        }}
        onClickCapture={(event) => {
          if (suppressClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} de ${count}: ${slide.alt}`}
            aria-hidden={index !== current}
            inert={index !== current}
            className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${index === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            {slide.href && slide.href !== "#" ? (
              <Link href={slide.href} tabIndex={index === current ? 0 : -1} className="relative block h-full w-full rounded-[18px] focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-[#E0C17E]">
                <BannerImage slide={slide} first={index === 0} />
              </Link>
            ) : <BannerImage slide={slide} first={index === 0} />}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-1">
          <button type="button" className={buttonClass} onClick={() => select(current - 1)} aria-label="Banner anterior" aria-controls={viewportId}>
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          {slides.map((slide, index) => (
            <button key={slide.id} type="button" onClick={() => select(index)} aria-label={`Mostrar banner ${index + 1}: ${slide.alt}`} aria-current={index === current ? "true" : undefined} aria-controls={viewportId} className={`${buttonClass} w-8`}>
              <span className={`block h-2 rounded-full transition-all motion-reduce:transition-none ${index === current ? "w-6 bg-[#9C7132]" : "w-2 bg-[#523760]/30"}`} />
            </button>
          ))}
          <button type="button" className={buttonClass} onClick={() => select(current + 1)} aria-label="Próximo banner" aria-controls={viewportId}>
            <ChevronRight size={20} aria-hidden="true" />
          </button>
          <button type="button" className={`${buttonClass} motion-reduce:hidden`} onPointerDown={() => { rotationBeforePointer.current = paused; }} onPointerCancel={() => { rotationBeforePointer.current = null; }} onClick={(event) => { setPaused(!(event.detail === 0 ? paused : (rotationBeforePointer.current ?? paused))); rotationBeforePointer.current = null; }} aria-label={paused ? "Iniciar troca automática de banners" : "Pausar troca automática de banners"} aria-controls={viewportId}>
            {paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}
          </button>
          <span className="sr-only" aria-live={paused ? "polite" : "off"} aria-atomic="true">Banner {current + 1} de {count}</span>
        </div>
      )}
    </section>
  );
}
