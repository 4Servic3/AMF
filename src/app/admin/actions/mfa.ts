'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function setupMFA() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' })
  
  if (error) {
    return { error: error.message }
  }

  return { id: data.id, totp: data.totp }
}

export async function verifyMFA(factorId: string, code: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  })

  if (error) {
    return { error: error.message }
  }

  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin', 'layout')

  return { success: true }
}

export async function getActiveFactors() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) return { error: error.message }
  return { factors: data.all }
}

export async function forceResetMFA() {
  const supabase = await createClient()
  const { data: factors } = await supabase.auth.mfa.listFactors()
  if (factors && factors.all) {
    for (const factor of factors.all) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id })
    }
  }
  return { success: true }
}

export async function unenrollMFA(factorId: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.mfa.unenroll({ factorId })
  
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
