interface Props {
  query: string;
  onChange: (q: string) => void;
}

export default function SearchBar({ query, onChange }: Props) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-lg select-none pointer-events-none">
        🔍
      </span>
      <input
        type="search"
        value={query}
        onChange={e => onChange(e.target.value)}
        placeholder="Buscar medicamento, classe ou indicação…"
        aria-label="Buscar medicamento"
        className="w-full pl-9 pr-9 py-3 rounded-xl text-sm border focus:outline-none transition-shadow"
        style={{
          background: 'white',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text)',
          boxShadow: query ? '0 0 0 2px var(--color-pine)' : 'none',
        }}
      />
      {query && (
        <button
          onClick={() => onChange('')}
          aria-label="Limpar busca"
          className="absolute right-3 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-70 text-lg"
        >
          ×
        </button>
      )}
    </div>
  );
}
