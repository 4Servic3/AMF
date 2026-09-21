import { useEffect, useState } from 'react';
import type { Category } from '../types';

interface Props {
  category: Category;
  showPending: boolean;
}

export default function CategoryBanner({ category, showPending }: Props) {
  const [key, setKey] = useState(0);

  useEffect(() => {
    setKey(k => k + 1);
  }, [category.id]);

  const count = showPending
    ? category.drugs.length
    : category.drugs.filter(d => !d.pendingValidation).length;

  return (
    <div
      key={key}
      className="banner-enter mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{ background: category.color }}
    >
      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-70 text-white mb-1">
          Categoria
        </p>
        <h2
          className="text-xl font-bold text-white leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {category.name}
        </h2>
        <p className="text-xs text-white opacity-70 mt-1">
          {count} {count === 1 ? 'medicamento' : 'medicamentos'}
        </p>
      </div>
    </div>
  );
}
