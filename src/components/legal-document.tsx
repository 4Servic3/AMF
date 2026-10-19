import Link from 'next/link';
import { getPublicSiteInformation } from '@/lib/site-information';
export async function LegalDocument({kind}:{kind:'terms'|'privacy'}) {
  const info = await getPublicSiteInformation();
  const title = kind === 'terms' ? 'Termos de uso' : 'Privacidade';
  return <main className="mx-auto min-h-screen max-w-3xl px-6 py-12 text-[#24102D]">
    <Link href="/" className="mb-8 inline-flex min-h-11 items-center text-sm text-[#1F5F54]">← Voltar ao início</Link>
    <h1 className="text-3xl font-semibold">{title}</h1>
    {info ? <><p className="mt-4 text-sm text-[#625C62]">{info.organization} · Responsável: {info.responsible}</p><div className="mt-8 whitespace-pre-wrap break-words text-base leading-7">{info[kind]}</div><p className="mt-8 text-sm">Contato: <a className="underline" href={'mailto:'+(kind==='privacy'?info.privacyEmail:info.supportEmail)}>{kind==='privacy'?info.privacyEmail:info.supportEmail}</a></p></> : <p className="mt-6 leading-7 text-[#625C62]">Este documento ainda não foi disponibilizado pela equipe AMF.</p>}
  </main>;
}
