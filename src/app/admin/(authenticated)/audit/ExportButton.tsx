'use client'

import { Download } from 'lucide-react'
import { exportAuditLogsCSV } from '../../actions/reports'
import { useState } from 'react'

export function ExportButton() {
  const [loading, setLoading] = useState(false)

  const handleExport = async () => {
    try {
      setLoading(true)
      const csv = await exportAuditLogsCSV()
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'audit_logs.csv'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error(err)
      alert('Failed to export CSV')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleExport} 
      disabled={loading}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
    >
      <Download className="w-4 h-4 mr-2" />
      {loading ? 'Exporting...' : 'Export CSV'}
    </button>
  )
}
