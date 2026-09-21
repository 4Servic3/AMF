import { useRef, useEffect } from 'react';
import type { Category } from '../types';

interface Props {
  categories: Category[];
  activeId: string;
  onSelect: (id: string) => void;
}

export default function CategoryChips({ categories, activeId, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active chip to center whenever it changes
  useEffect(() => {
    const chip = activeRef.current;
    const scroll = scrollRef.current;
    if (!chip || !scroll) return;
    const chipLeft = chip.offsetLeft;
    const chipWidth = chip.offsetWidth;
    const scrollWidth = scroll.offsetWidth;
    scroll.scrollTo({ left: chipLeft - scrollWidth / 2 + chipWidth / 2, behavior: 'smooth' });
  }, [activeId]);

  const activeIndex = categories.findIndex(c => c.id === activeId);

  function prev() {
    if (activeIndex > 0) onSelect(categories[activeIndex - 1].id);
  }
  function next() {
    if (activeIndex < categories.length - 1) onSelect(categories[activeIndex + 1].id);
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={prev}
        disabled={activeIndex === 0}
        aria-label="Categoria anterior"
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all disabled:opacity-25 active:scale-95"
        style={{ background: 'var(--color-pine-light)', color: 'var(--color-pine)' }}
      >
        ‹
      </button>

      <div ref={scrollRef} className="chips-scroll min-w-0 flex-1 flex gap-2 overflow-x-auto py-1">
        {categories.map(cat => {
          const isActive = cat.id === activeId;
          return (
            <button
              key={cat.id} aria-pressed={isActive}
              ref={isActive ? activeRef : undefined}
              onClick={() => onSelect(cat.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap"
              style={
                isActive
                  ? { background: cat.color, color: '#fff', boxShadow: `0 2px 8px ${cat.color}60` }
                  : { background: 'var(--color-paper-dark)', color: 'var(--color-text-muted)' }
              }
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      <button
        onClick={next}
        disabled={activeIndex === categories.length - 1}
        aria-label="Próxima categoria"
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all disabled:opacity-25 active:scale-95"
        style={{ background: 'var(--color-pine-light)', color: 'var(--color-pine)' }}
      >
        ›
      </button>
    </div>
  );
}

