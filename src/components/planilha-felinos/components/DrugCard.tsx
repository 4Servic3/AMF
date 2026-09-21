import { useState } from 'react';
import type { Drug } from '../types';
import DoseDisplay from './DoseDisplay';

interface Props {
  drug: Drug;
  weight: number;
  categoryColor: string;
  categoryName?: string;
}

export default function DrugCard({ drug, weight, categoryColor, categoryName }: Props) {
  const [expanded, setExpanded] = useState(false);

  const hasDetails = drug.contraindications || drug.observations;

  return (
    <article
      className="mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{ background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            {drug.pendingValidation && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mb-1"
                style={{ background: '#FFF3CD', color: '#856404' }}
              >
                ⏳ Em validação
              </span>
            )}
            <h3
              className="text-base font-semibold leading-snug"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
            >
              {drug.name}
            </h3>
            {categoryName && (
              <span className="text-xs mt-0.5 inline-block opacity-60">
                {categoryName}
              </span>
            )}
          </div>
          <span
            className="flex-shrink-0 max-w-[140px] px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 truncate"
            style={{ background: categoryColor + '18', color: categoryColor }}
            title={drug.pharmClass}
          >
            {drug.pharmClass}
          </span>
        </div>

        {drug.indication && (
          <p className="text-xs mb-2.5" style={{ color: 'var(--color-text-muted)' }}>
            {drug.indication}
          </p>
        )}

        {/* Dose row */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Dose:</span>
            <DoseDisplay
              calc={drug.calc}
              weight={weight}
              doseRef={drug.doseRef}
              categoryColor={categoryColor}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {drug.interval && <Tag label={drug.interval} icon="⏱" />}
          {drug.route && <Tag label={drug.route} icon="💉" />}
          {drug.maxDose && <Tag label={`Máx: ${drug.maxDose}`} icon="⚠️" color="var(--color-alert-light)" textColor="var(--color-alert)" />}
          {drug.maxDuration && <Tag label={drug.maxDuration} icon="📅" />}
        </div>
      </div>

      {/* Expandable details */}
      {hasDetails && (
        <>
          <button
            type="button" aria-expanded={expanded} onClick={() => setExpanded(e => !e)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs font-medium border-t transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: expanded ? categoryColor : 'var(--color-text-muted)',
              background: expanded ? categoryColor + '08' : 'transparent',
            }}
          >
            <span>{expanded ? 'Ocultar detalhes' : 'Ver contraindicações e observações'}</span>
            <span className="transition-transform" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
              ▾
            </span>
          </button>

          {expanded && (
            <div className="expand-enter px-4 pb-4 pt-2 space-y-3">
              {drug.contraindications && (
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'var(--color-alert-light)' }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--color-alert)' }}
                  >
                    ⛔ Contraindicações
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: '#7B1818' }}>
                    {drug.contraindications}
                  </p>
                </div>
              )}
              {drug.observations && (
                <div
                  className="rounded-xl p-3"
                  style={{ background: 'var(--color-pine-light)' }}
                >
                  <p
                    className="text-xs font-semibold uppercase tracking-wider mb-1"
                    style={{ color: 'var(--color-pine)' }}
                  >
                    📋 Observações Clínicas
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--color-pine-dark)' }}>
                    {drug.observations}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </article>
  );
}

function Tag({
  label,
  icon,
  color = 'var(--color-paper-dark)',
  textColor = 'var(--color-text-muted)',
}: {
  label: string;
  icon?: string;
  color?: string;
  textColor?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs"
      style={{ background: color, color: textColor }}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}

