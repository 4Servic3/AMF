import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCommunityAccess } from '@/lib/services/community-access';

export default async function ComunidadePage() {
  const access = await getCommunityAccess();
  if (access.state === 'unauthenticated') redirect('/entrar');
  return (
    <div className="max-w-3xl mx-auto pb-12">
      <h1 className="text-3xl font-bold text-(--color-amf-plum)">Comunidade</h1>
      <p className="text-(--color-amf-muted) mt-1 mb-8">Networking e discussão clínica entre alunos.</p>
      <section className="bg-white border border-(--color-amf-border) rounded-2xl p-8 shadow-sm">
        <h2 className="text-2xl font-editorial font-bold text-(--color-amf-plum) mb-4">
          {access.state === 'available' ? 'Seus grupos' : access.state === 'locked' ? 'Acesso restrito' : 'Comunidade indisponível'}
        </h2>
        {access.state === 'available' ? (
          <>
            <ul className="space-y-3">{access.links.map((link) => (
              <li key={link.id}><a href={link.href} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-lg bg-(--color-amf-plum) px-5 py-3 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2">{link.title}</a></li>
            ))}</ul>
            <p className="mt-6 text-sm text-(--color-amf-muted)">Preserve a privacidade: não compartilhe dados identificáveis de tutores ou pacientes.</p>
          </>
        ) : <p className="text-(--color-amf-muted)">{access.state === 'locked'
          ? 'Os grupos são liberados conforme o acesso vigente ao curso que oferece esse benefício.'
          : 'Não há um grupo disponível para seus acessos neste momento. Tente novamente mais tarde.'}</p>}
        <Link href="/app/perfil/suporte" className="inline-block mt-6 text-sm font-semibold text-(--color-amf-plum) underline">Falar com o suporte</Link>
      </section>
    </div>
  );
}
