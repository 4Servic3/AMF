import { createClient } from '@/lib/supabase/server'
import { requireAal2, requirePermission } from '@/lib/auth/dal'
import { reprocessWebhook, requeueJob } from '../actions/ops'
import { RefreshCw } from 'lucide-react'

export default async function OperationsPage() {
  await requireAal2()
  await requirePermission('ops.manage')
  const supabase = await createClient()
  
  const { data: webhooks } = await supabase.from('webhook_events').select('*').order('created_at', { ascending: false }).limit(20)
  const { data: jobs } = await supabase.from('background_jobs').select('*').order('created_at', { ascending: false }).limit(20)

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Operations</h1>
      
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Recent Webhooks</h2>
        <div className="border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">ID</th>
                <th className="p-3 text-left font-medium">Event</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {webhooks?.map((wh: any) => (
                <tr key={wh.id} className="border-b">
                  <td className="p-3">{wh.id}</td>
                  <td className="p-3">{wh.event_type}</td>
                  <td className="p-3">{wh.status}</td>
                  <td className="p-3 text-right">
                    <form action={reprocessWebhook.bind(null, wh.id)}>
                      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        <RefreshCw className="w-4 h-4 mr-2"/> Reprocess
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!webhooks?.length && (
                <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">No webhooks found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Background Jobs</h2>
        <div className="border rounded-md">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="p-3 text-left font-medium">ID</th>
                <th className="p-3 text-left font-medium">Job Name</th>
                <th className="p-3 text-left font-medium">Status</th>
                <th className="p-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs?.map((job: any) => (
                <tr key={job.id} className="border-b">
                  <td className="p-3">{job.id}</td>
                  <td className="p-3">{job.name}</td>
                  <td className="p-3">{job.status}</td>
                  <td className="p-3 text-right">
                    <form action={requeueJob.bind(null, job.id)}>
                      <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        <RefreshCw className="w-4 h-4 mr-2"/> Requeue
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!jobs?.length && (
                <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">No jobs found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
