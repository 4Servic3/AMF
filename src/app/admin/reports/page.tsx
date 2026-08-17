import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { MetricsCharts } from './charts'

export default async function ReportsPage() {
  await requireAal2()
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Analytics Reports</h1>
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="p-6 border rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Total Revenue</h3>
          <p className="text-3xl font-bold">$12,345</p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground">Active Users</h3>
          <p className="text-3xl font-bold">1,234</p>
        </div>
        <div className="p-6 border rounded-lg shadow-sm">
          <h3 className="font-semibold text-muted-foreground">New Signups</h3>
          <p className="text-3xl font-bold">89</p>
        </div>
      </div>
      <div className="border p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-6">Revenue & User Growth</h2>
        <MetricsCharts />
      </div>
    </div>
  )
}
