import { useRef } from 'react';

interface Props {
  weight: number;
  onChange: (w: number) => void;
}

const MIN = 0.5;
const MAX = 20;
const STEP = 0.5;

export default function WeightStepper({ weight, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function clamp(v: number) {
    return Math.min(MAX, Math.max(MIN, Math.round(v * 10) / 10));
  }

  function decrement() { onChange(clamp(weight - STEP)); }
  function increment() { onChange(clamp(weight + STEP)); }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(',', '.');
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) onChange(clamp(parsed));
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-widest opacity-60 hidden sm:block">
        Peso
      </span>
      <button
        onClick={decrement}
        aria-label="Diminuir peso"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold transition-all active:scale-95"
        style={{ background: 'var(--color-pine-light)', color: 'var(--color-pine)' }}
      >
        −
      </button>
      <div className="flex items-baseline gap-1">
        <input
          ref={inputRef}
          type="number"
          inputMode="decimal"
          min={MIN}
          max={MAX}
          step={STEP}
          value={weight}
          onChange={handleInput}
          aria-label="Peso em kg"
          className="w-16 text-center text-2xl font-semibold bg-transparent border-b-2 border-current focus:outline-none"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-pine)' }}
        />
        <span className="text-sm font-medium opacity-70">kg</span>
      </div>
      <button
        onClick={increment}
        aria-label="Aumentar peso"
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold transition-all active:scale-95"
        style={{ background: 'var(--color-pine-light)', color: 'var(--color-pine)' }}
      >
        +
      </button>
    </div>
  );
}
