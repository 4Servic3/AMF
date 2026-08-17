'use client'

import { useState, useEffect } from 'react'
import { setupMFA } from '../../actions/mfa'

export default function EnrollPage() {
  const [mfaData, setMfaData] = useState<{ id: string, totp: string } | null>(null)
  const [isResetting, setIsResetting] = useState(false)

  async function loadMfa() {
    const data = await setupMFA()
    if (!data.error) setMfaData(data as any)
    else setMfaData({ id: 'error', totp: 'Failed to generate TOTP: ' + data.error })
  }

  useEffect(() => {
    loadMfa()
  }, [])

  async function handleReset() {
    setIsResetting(true)
    const { forceResetMFA } = await import('../../actions/mfa')
    await forceResetMFA()
    await loadMfa()
    setIsResetting(false)
  }

  if (!mfaData) return <div className="text-center p-4">Loading MFA details...</div>

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Setup MFA</h3>
      
      {mfaData.id === 'error' ? (
        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded text-red-800 text-sm border border-red-200">
            {mfaData.totp}
          </div>
          <button 
            onClick={handleReset} 
            disabled={isResetting}
            className="flex w-full justify-center rounded-md bg-red-600 py-2 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isResetting ? 'Resetando...' : 'Resetar MFA Antigo e Criar Novo'}
          </button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-600">Scan this code with your authenticator app:</p>
          <div className="flex flex-col items-center gap-4">
            <div 
              className="bg-white p-2 rounded-lg border border-gray-200 shadow-sm"
              dangerouslySetInnerHTML={{ __html: (mfaData.totp as any).qr_code }} 
            />
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-1">Or enter this secret manually:</p>
              <div className="bg-gray-100 px-3 py-2 rounded text-center font-mono text-sm border border-gray-300 break-all">
                {(mfaData.totp as any).secret}
              </div>
            </div>
          </div>
        </>
      )}

      <a href="/admin/mfa/challenge" className="flex w-full justify-center rounded-md bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700">
        Continue to Challenge
      </a>
    </div>
  )
}
