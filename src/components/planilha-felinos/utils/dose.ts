import type { CalcInfo } from '../types';

export function calcDose(calc: CalcInfo, weightKg: number): string | null {
  if (calc.type !== 'mg_per_kg') return null;
  if (!calc.minCoef || !calc.maxCoef) return null;

  const unit = calc.unit ?? 'mg';
  const min = Math.round(weightKg * calc.minCoef * 100) / 100;
  const max = Math.round(weightKg * calc.maxCoef * 100) / 100;

  const fmt = (n: number) => {
    const s = n.toFixed(2);
    // drop trailing zeros: 10.00 → 10 · 10.50 → 10.5
    return s.replace(/\.?0+$/, '');
  };

  if (min === max) return `${fmt(min)} ${unit}`;
  return `${fmt(min)} – ${fmt(max)} ${unit}`;
}
