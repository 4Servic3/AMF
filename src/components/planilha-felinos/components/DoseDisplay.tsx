import type { CalcInfo } from '../types';
import { calcDose } from '../utils/dose';

interface Props {
  calc: CalcInfo;
  weight: number;
  doseRef: string;
  categoryColor: string;
}

export default function DoseDisplay({ calc, weight, doseRef, categoryColor }: Props) {
  if (calc.type === 'pending') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: '#FFF3CD', color: '#856404' }}
      >
        <span>⏳</span> Em validação
      </span>
    );
  }

  if (calc.type === 'mg_per_kg') {
    const result = calcDose(calc, weight);
    if (!result) return <RefText text={doseRef} />;
    return (
      <span
        className="dose-mono inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-sm font-semibold"
        style={{ background: categoryColor + '18', color: categoryColor }}
      >
        {result}
        <span className="text-xs opacity-60">/ {weight} kg</span>
      </span>
    );
  }

  if (calc.type === 'fixed') {
    return (
      <span className="inline-flex items-center gap-1">
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'var(--color-paper-dark)', color: 'var(--color-text-muted)' }}
        >
          Dose fixa
        </span>
        {calc.displayText && <RefText text={calc.displayText} />}
      </span>
    );
  }

  if (calc.type === 'per_m2') {
    return (
      <span className="inline-flex items-center gap-1">
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'var(--color-paper-dark)', color: 'var(--color-text-muted)' }}
        >
          mg/m²
        </span>
        {calc.displayText && <RefText text={calc.displayText} />}
      </span>
    );
  }

  if (calc.type === 'topical') {
    return (
      <span className="inline-flex items-center gap-1">
        <span
          className="px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ background: 'var(--color-paper-dark)', color: 'var(--color-text-muted)' }}
        >
          Tópico
        </span>
        {calc.displayText && <RefText text={calc.displayText} />}
      </span>
    );
  }

  // reference_only
  return <RefText text={doseRef || calc.displayText || ''} />;
}

function RefText({ text }: { text: string }) {
  if (!text) return null;
  return (
    <span
      className="dose-mono text-sm"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {text}
    </span>
  );
}
