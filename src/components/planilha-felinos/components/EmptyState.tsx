interface Props {
  query: string;
}

export default function EmptyState({ query }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <span className="text-5xl mb-4">🐱</span>
      <p
        className="text-lg font-semibold mb-2"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
      >
        Nenhum resultado
      </p>
      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Não encontramos &quot;{query}&quot; na base de dados.
        <br />
        Tente outro nome, classe ou indicação.
      </p>
    </div>
  );
}

