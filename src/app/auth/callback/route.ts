import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ensureMemberProfile } from '@/lib/auth/member-profile';
import { createClient } from '@/lib/supabase/server';
import { authOrigin, recoveryProof, RECOVERY_COOKIE, hasRecentRecoveryMethod } from '@/lib/auth/recovery';
export async function GET(request: Request) {
  const origin = authOrigin();
  const code = new URL(request.url).searchParams.get('code');
  const jar = await cookies();
  jar.delete(RECOVERY_COOKIE);
  if (code) {
    const db = await createClient();
    const { data, error } = await db.auth.exchangeCodeForSession(code);
    if (!error && data.session && data.user) {
      if ('redirectType' in data && data.redirectType === 'recovery' && hasRecentRecoveryMethod(data.session.access_token)) {
        jar.set(RECOVERY_COOKIE, recoveryProof(data.user.id, data.session.access_token), { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 900 });
        return NextResponse.redirect(new URL('/redefinir-senha', origin), { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
      }
      await ensureMemberProfile();
      return NextResponse.redirect(new URL('/app', origin), { headers: { 'Cache-Control': 'no-store' } });
    }
  }
  return NextResponse.redirect(new URL('/recuperar-senha?invalid=1', origin), { headers: { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' } });
}




