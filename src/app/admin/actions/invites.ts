'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function acceptInvite(tokenHash: string) {
  const supabase = await createClient()
  
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: 'invite',
  })

  if (error) {
    return { error: error.message }
  }

  // Redirect to password reset or admin dashboard after accepting
  redirect('/admin')
}
