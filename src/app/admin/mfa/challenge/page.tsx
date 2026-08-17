'use client'

import { verifyMFA, getActiveFactors } from '../../actions/mfa'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export default function ChallengePage() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [factorId, setFactorId] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    getActiveFactors().then(res => {
      if (res.factors && res.factors.length > 0) {
        setFactorId(res.factors[0].id)
      } else if (res.error) {
        setError(res.error)
      }
    })
  }, [])

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId) {
      setError('No active MFA factor found for this user.')
      return
    }
    const res = await verifyMFA(factorId, code)
    if (res.error) {
      setError(res.error)
    } else {
      router.push('/admin')
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">MFA Challenge</h3>
      <form onSubmit={handleVerify} className="space-y-4">
        <input type="hidden" value={factorId} />
        <div>
          <label className="block text-sm font-medium text-gray-700">Authenticator Code</label>
          <input type="text" value={code} onChange={e => setCode(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm p-2 border" placeholder="Enter 6-digit code" />
        </div>
        {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded border border-red-200">{error}</div>}
        <button type="submit" disabled={!factorId} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
          Verify
        </button>
      </form>
    </div>
  )
}
