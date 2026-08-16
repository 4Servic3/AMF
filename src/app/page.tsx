import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-(--background)">
      <div className="z-10 w-full max-w-5xl items-center justify-between font-sans text-sm flex flex-col gap-8">
        <h1 className="text-4xl font-editorial font-bold text-center text-(--color-amf-plum)">
          Academia de Medicina Felina
        </h1>
        <p className="text-center text-(--color-amf-foreground) text-lg max-w-2xl">
          Uma plataforma de atualização clínica contínua para médicos-veterinários que querem atender felinos com mais segurança.
        </p>
        <div className="flex gap-4">
          <Link 
            href="/entrar"
            className="px-6 py-3 rounded-md bg-(--color-amf-teal) text-white font-medium hover:opacity-90 transition-opacity"
          >
            Entrar
          </Link>
          <Link 
            href="/cadastro"
            className="px-6 py-3 rounded-md border border-(--color-amf-teal-dark) text-(--color-amf-teal-dark) font-medium hover:bg-black/5 transition-colors"
          >
            Cadastre-se
          </Link>
        </div>
      </div>
    </main>
  );
}
