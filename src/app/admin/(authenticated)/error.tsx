"use client";
export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="amf-panel max-w-xl space-y-4">
      <h1 className="text-2xl">Não foi possível carregar esta área</h1>
      <p>
        Confira sua conexão e tente novamente. Uma falha de consulta não
        significa que os registros foram apagados.
      </p>
      <button className="amf-primary" onClick={reset}>
        Tentar novamente
      </button>
    </section>
  );
}
