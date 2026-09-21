'use client';
import { useState, useMemo, useRef, useCallback } from 'react';
import type { Category, AppData } from './types';
import styles from './planilha.module.css';
import WeightStepper from './components/WeightStepper';
import SearchBar from './components/SearchBar';
import CategoryChips from './components/CategoryChips';
import CategoryBanner from './components/CategoryBanner';
import DrugCard from './components/DrugCard';
import EmptyState from './components/EmptyState';
import Disclaimer from './components/Disclaimer';
import { matchesSearch } from './utils/normalize';




export default function PlanilhaFelinos({ appData }: { appData: AppData }) {
  const categories: Category[] = appData.categories;
  const [weight, setWeight] = useState(4);
  const [activeCatId, setActiveCatId] = useState(categories[0].id);
  const [query, setQuery] = useState('');
  const [showPending, setShowPending] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const activeCat = useMemo(
    () => categories.find(c => c.id === activeCatId) ?? categories[0],
    [activeCatId, categories]
  );

  // Filtered drugs for search mode
  const searchResults = useMemo(() => {
    if (!query.trim()) return null;
    const results: Array<{ drug: (typeof categories)[0]['drugs'][0]; category: Category }> = [];
    for (const cat of categories) {
      for (const drug of cat.drugs) {
        if (!showPending && drug.pendingValidation) continue;
        if (matchesSearch(query, drug.name, drug.pharmClass, drug.indication)) {
          results.push({ drug, category: cat });
        }
      }
    }
    return results;
  }, [query, showPending, categories]);

  // Drugs for current category (non-search)
  const categoryDrugs = useMemo(
    () => (showPending ? activeCat.drugs : activeCat.drugs.filter(d => !d.pendingValidation)),
    [activeCat, showPending]
  );

  const handleCategorySelect = useCallback((id: string) => {
    setActiveCatId(id);
    listRef.current?.scrollTo({ top: 0 });
  }, []);

  const isSearching = Boolean(query.trim());

  // Group category drugs by subcategory
  const groupedDrugs = useMemo(() => {
    const groups: Array<{ subcategory: string | null; drugs: typeof categoryDrugs }> = [];
    for (const drug of categoryDrugs) {
      const last = groups[groups.length - 1];
      if (last && last.subcategory === drug.subcategory) {
        last.drugs.push(drug);
      } else {
        groups.push({ subcategory: drug.subcategory, drugs: [drug] });
      }
    }
    return groups;
  }, [categoryDrugs]);

  const generatedAt = appData.generatedAt;

  return (
    <div className={styles.root + " flex flex-col"} style={{ background: 'var(--color-paper)' }}>
      {/* ── Sticky header ── */}
      <header
        className="sticky top-0 z-30 px-4 pb-3 pt-4"
        style={{ background: 'var(--color-paper)', borderBottom: '1px solid var(--color-border)' }}
      >
        {/* Title row */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div>
            <h1
              className="text-lg font-bold leading-none"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-pine)' }}
            >
              Doses Seguras · Felinos
            </h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Dra. Polyana · Close Friends
            </p>
          </div>
          <WeightStepper weight={weight} onChange={setWeight} />
        </div>

        {/* Search */}
        <SearchBar query={query} onChange={setQuery} />

        {/* Category nav (hidden during search) */}
        {!isSearching && (
          <div className="mt-2">
            <CategoryChips
              categories={categories}
              activeId={activeCatId}
              onSelect={handleCategorySelect}
            />
          </div>
        )}

        {/* Pending toggle */}
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {isSearching
              ? `${searchResults?.length ?? 0} resultado${searchResults?.length === 1 ? '' : 's'}`
              : `${categoryDrugs.length} medicamento${categoryDrugs.length === 1 ? '' : 's'}`}
          </span>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Mostrar em validação
            </span>
            <button
              type="button" role="switch" aria-label="Mostrar medicamentos em validação"
              aria-checked={showPending}
              onClick={() => setShowPending(p => !p)}
              className="relative w-9 h-5 rounded-full transition-colors"
              style={{ background: showPending ? 'var(--color-pine)' : 'var(--color-border)' }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: showPending ? 'translateX(18px)' : 'translateX(2px)' }}
              />
            </button>
          </label>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <div ref={listRef} className="flex-1 overflow-y-auto">
        <div className="py-3 pb-8">

          {isSearching ? (
            /* ── Search results ── */
            searchResults && searchResults.length > 0 ? (
              searchResults.map(({ drug, category }) => (
                <DrugCard
                  key={drug.id}
                  drug={drug}
                  weight={weight}
                  categoryColor={category.color}
                  categoryName={category.name}
                />
              ))
            ) : (
              <EmptyState query={query} />
            )
          ) : (
            /* ── Category view ── */
            <>
              <CategoryBanner category={activeCat} showPending={showPending} />

              {groupedDrugs.map(group => (
                <div key={group.subcategory ?? '__root'}>
                  {group.subcategory && (
                    <div
                      className="mx-4 mb-2 mt-1 px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider"
                      style={{ background: activeCat.color + '18', color: activeCat.color }}
                    >
                      {group.subcategory}
                    </div>
                  )}
                  {group.drugs.map(drug => (
                    <DrugCard
                      key={drug.id}
                      drug={drug}
                      weight={weight}
                      categoryColor={activeCat.color}
                    />
                  ))}
                </div>
              ))}

              {categoryDrugs.length === 0 && (
                <div className="flex flex-col items-center py-12 text-center px-8">
                  <span className="text-4xl mb-3">✅</span>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Todos os itens desta categoria estão em validação.
                    <br />
                    Ative &quot;Mostrar em validação&quot; para exibi-los.
                  </p>
                </div>
              )}
            </>
          )}

          <Disclaimer />

          <p
            className="text-center text-xs px-4 pb-2"
            style={{ color: 'var(--color-text-muted)', opacity: 0.5 }}
          >
            Dados gerados em {new Date(generatedAt).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
          </p>
        </div>
      </div>
    </div>
  );
}


