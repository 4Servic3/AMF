import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MemberAuthForm from '@/components/auth/member-auth-form';
import { createClient } from '@/lib/supabase/server';
import { RECOVERY_COOKIE, validRecoveryProof } from '@/lib/auth/recovery';
export const metadata = { title: 'Nova senha | AMF' };
export default async function Page() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  const { data: { session } } = await db.auth.getSession();
  const jar = await cookies();
  if (error || !user || !session || !validRecoveryProof(jar.get(RECOVERY_COOKIE)?.value, user.id, session.access_token)) redirect('/recuperar-senha?invalid=1');
  return <MemberAuthForm mode="reset" />;
}

