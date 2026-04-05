import { useAuth } from '@/context/AuthContext'
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests'
import StatusBadge from '@/components/maintenance/StatusBadge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Clock } from 'lucide-react'

const statMeta = [
  { icon: AlertCircle, bg: 'bg-amber-100', text: 'text-amber-600' },
  { icon: Clock,       bg: 'bg-blue-100',  text: 'text-blue-600' },
]

export default function TenantDashboard() {
  const { profile } = useAuth()
  const { requests, loading } = useMaintenanceRequests()

  const open = requests.filter((r) => r.status === 'open').length
  const inProgress = requests.filter((r) => r.status === 'in_progress').length

  return (
    <div className="space-y-10">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Welcome</p>
        <h1 className="text-4xl font-black tracking-tight leading-none">
          {profile?.full_name?.split(' ')[0]}
        </h1>
      </div>

      <div className="grid grid-cols-2 bg-border gap-px">
        {[
          { label: 'Open Requests', value: open },
          { label: 'In Progress', value: inProgress },
        ].map(({ label, value }, i) => {
          const { icon: Icon, bg, text } = statMeta[i]
          return (
            <div key={label} className="bg-white p-6">
              <div className={`inline-flex h-8 w-8 items-center justify-center mb-3 ${bg}`}>
                <Icon className={`h-4 w-4 ${text}`} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
              {loading ? (
                <Skeleton className="h-10 w-16 mt-2 rounded-none" />
              ) : (
                <p className="text-5xl font-black tracking-tighter mt-1">{value}</p>
              )}
            </div>
          )
        })}
      </div>

      {!loading && requests.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Recent Requests</p>
          <div className="bg-border gap-px flex flex-col">
            {requests.slice(0, 5).map((req) => (
              <div key={req.id} className="bg-white px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm">{req.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
