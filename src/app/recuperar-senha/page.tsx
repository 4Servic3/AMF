import MemberAuthForm from '@/components/auth/member-auth-form';
export const metadata = { title: 'Recuperar senha | AMF' };
export default async function Page({ searchParams }: { searchParams: Promise<{ invalid?: string }> }) {
  const { invalid } = await searchParams;
  return <>{invalid && <p role="alert" className="bg-amber-50 p-4 text-center text-sm">Link inválido ou expirado. Solicite outro link e abra no mesmo navegador.</p>}<MemberAuthForm mode="recover" /></>;
}

