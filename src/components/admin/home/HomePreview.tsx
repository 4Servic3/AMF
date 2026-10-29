"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_BANNER_IMAGE, PLANILHA_SLIDE, PREVIEW_MESSAGE, bannerInPeriod } from "@/lib/home-banner-slides";
import type { HomeBannerSlide } from "@/components/home/home-banner-carousel";

/** Estado de um banner como está no formulário, ainda sem salvar. */
export type BannerDraft = { key: string; title: string; status: string; startsAt: string; endsAt: string; imageUrl: string; href?: string };
export const DRAFT_EVENT = "amf-banner-draft";
export const DRAFT_REMOVE_EVENT = "amf-banner-draft-remove";

const DEVICES = {
  mobile: { label: "Celular", width: 390, height: 780 },
  desktop: { label: "Computador", width: 1280, height: 800 },
} as const;
type Device = keyof typeof DEVICES;

const requestTime = () => Date.now();

/** Banners que o aluno veria com os formulários como estão, e o que está sendo editado mesmo em rascunho. */
function draftSlides(order: string[], drafts: Record<string, BannerDraft>, focus: string): HomeBannerSlide[] {
  const now = requestTime();
  const keys = [...order, ...Object.keys(drafts).filter((k) => !order.includes(k))];
  const slides = keys
    .map((k) => drafts[k])
    .filter((d): d is BannerDraft => !!d && (d.key === focus || (d.status === "published" && bannerInPeriod(d.startsAt, d.endsAt, now))))
    .map((d) => ({ id: d.key, imageUrl: d.imageUrl || DEFAULT_BANNER_IMAGE, href: d.href, alt: d.title || "Boas-vindas à área de membros" }));
  return [...(slides.length ? slides : [{ id: "welcome", imageUrl: DEFAULT_BANNER_IMAGE, alt: "Boas-vindas à área de membros" }]), PLANILHA_SLIDE];
}

export default function HomePreview({ order }: { order: string[] }) {
  const [device, setDevice] = useState<Device>("mobile");
  const [drafts, setDrafts] = useState<Record<string, BannerDraft>>({});
  const [focus, setFocus] = useState("");
  const [frameKey, setFrameKey] = useState(0);
  const [boxWidth, setBoxWidth] = useState(0);
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);

  // Cada BannerEditor avisa quando o formulário muda.
  useEffect(() => {
    const change = (event: Event) => {
      const draft = (event as CustomEvent<BannerDraft & { touched?: boolean }>).detail;
      setDrafts((all) => ({ ...all, [draft.key]: draft }));
      if (draft.touched) setFocus(draft.key);
    };
    const remove = (event: Event) => {
      const key = (event as CustomEvent<string>).detail;
      setDrafts((all) => { const next = { ...all }; delete next[key]; return next; });
      setFocus((f) => (f === key ? "" : f));
      setFrameKey((k) => k + 1);
    };
    window.addEventListener(DRAFT_EVENT, change);
    window.addEventListener(DRAFT_REMOVE_EVENT, remove);
    return () => { window.removeEventListener(DRAFT_EVENT, change); window.removeEventListener(DRAFT_REMOVE_EVENT, remove); };
  }, []);

  const send = useCallback(() => {
    if (!Object.keys(drafts).length) return;
    frame.current?.contentWindow?.postMessage({ type: PREVIEW_MESSAGE, slides: draftSlides(order, drafts, focus), focus }, window.location.origin);
  }, [order, drafts, focus]);

  useEffect(send, [send]);
  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === "amf-preview-ready") send();
    };
    window.addEventListener("message", ready);
    return () => window.removeEventListener("message", ready);
  }, [send]);

  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);

  const size = DEVICES[device];
  // No celular a prévia cabe na altura da tela do admin sem rolar.
  const scale = boxWidth ? Math.min(1, boxWidth / size.width, device === "mobile" ? 640 / size.height : 1) : 1;
  const focused = focus && drafts[focus];

  return (
    <section className="amf-panel" aria-labelledby="previa">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="previa" className="text-[17px]">Prévia da home</h2>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Tamanho da tela" className="flex rounded-full bg-[var(--admin-fill)] p-1">
            {(Object.keys(DEVICES) as Device[]).map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={device === d}
                onClick={() => setDevice(d)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold ${device === d ? "bg-white text-[var(--admin-label)] shadow-sm" : "text-[var(--admin-secondary)]"}`}
              >
                {DEVICES[d].label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setFrameKey((k) => k + 1)} className="amf-secondary text-sm" aria-label="Recarregar prévia">Recarregar</button>
        </div>
      </div>
      <p className="mt-2 text-sm text-[var(--admin-secondary)]">
        {focused && focused.status !== "published"
          ? "Mostrando o banner em edição, que ainda não está no ar para o aluno."
          : "É a home real do aluno. As mudanças nos banners aparecem aqui antes de salvar."}
      </p>
      <div ref={box} className="mt-4 flex w-full min-w-0 justify-center overflow-hidden">
        <div
          className={`overflow-hidden bg-[#FAF7F1] ${device === "mobile" ? "rounded-[36px] border-[10px] border-[#1d1b20] shadow-xl" : "rounded-xl border border-[var(--admin-border)]"}`}
          style={{ width: size.width * scale + (device === "mobile" ? 20 : 2), height: size.height * scale + (device === "mobile" ? 20 : 2) }}
        >
          <iframe
            key={frameKey}
            ref={frame}
            src="/app"
            title={`Prévia da home do aluno no ${size.label.toLowerCase()}`}
            onLoad={send}
            style={{ width: size.width, height: size.height, transform: `scale(${scale})`, transformOrigin: "top left", border: 0 }}
          />
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--admin-tertiary)]">A prévia usa a sua conta: cursos e progresso aparecem como os seus.</p>
    </section>
  );
}
