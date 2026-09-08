import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { MetricsCharts } from './charts'
import PageHeader from '@/components/admin/ui/PageHeader'

export const metadata = { title: 'Relatorios | AMF Admin' }

export default async function ReportsPage() {
  await requireAal2()
  await requirePermission('reports.read')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Relatorios" description="Metricas de receita, usuarios e crescimento." />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="p-6 bg-white rounded-xl border border-amf-border">
          <h3 className="text-sm font-medium text-amf-ink-400 mb-1">Receita Total</h3>
          <p className="text-3xl font-bold text-amf-ink-900">—</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-amf-border">
          <h3 className="text-sm font-medium text-amf-ink-400 mb-1">Usuarios Ativos</h3>
          <p className="text-3xl font-bold text-amf-ink-900">—</p>
        </div>
        <div className="p-6 bg-white rounded-xl border border-amf-border">
          <h3 className="text-sm font-medium text-amf-ink-400 mb-1">Novos Cadastros</h3>
          <p className="text-3xl font-bold text-amf-ink-900">—</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-amf-border">
        <h2 className="text-base font-semibold mb-6">Receita e Crescimento</h2>
        <MetricsCharts />
      </div>
    </div>
  )
}