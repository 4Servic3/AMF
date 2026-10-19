"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

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
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const viewportId = "home-banner-slides";
  const count = slides.length;
  const current = count ? active % count : 0;

  useEffect(() => {
    if (count < 2) return;
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
  }, [count]);

  function select(index: number) {
    setActive((index + count) % count);
  }

  if (!count) return null;

  return (
    <section
      aria-label="Destaques da academia"
      aria-roledescription="carrossel"
      className="w-full min-w-0 mb-6 sm:mb-7"
    >
      <div
        id={viewportId}
        className="amf-home-banner relative mx-auto w-full max-w-[1240px] overflow-hidden rounded-[18px] border border-[rgba(224,193,126,0.15)] bg-[#160B24] shadow-[0_8px_24px_rgba(17,15,24,0.3)] sm:rounded-[20px]"
        style={{ aspectRatio: "2/1", touchAction: "pan-y" }}
        tabIndex={0}
        onKeyDown={(event) => {
          if (count < 2 || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
          event.preventDefault();
          select(current + (event.key === "ArrowRight" ? 1 : -1));
        }}
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
      {count > 1 && <p className="sr-only" aria-live="off">Banner {current + 1} de {count}. Deslize para mudar ou use as setas do teclado.</p>}
    </section>
  );
}
