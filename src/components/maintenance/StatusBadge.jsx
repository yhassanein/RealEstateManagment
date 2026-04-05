import { cn } from '@/lib/utils'

const statusConfig = {
  open: { label: 'Open', className: 'border-amber-400 text-amber-700 bg-amber-50' },
  in_progress: { label: 'In Progress', className: 'border-blue-400 text-blue-700 bg-blue-50' },
  resolved: { label: 'Resolved', className: 'border-emerald-400 text-emerald-700 bg-emerald-50' },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] ?? { label: status, className: 'border-border text-muted-foreground bg-muted' }
  return (
    <span className={cn(
      'inline-flex items-center border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
      config.className
    )}>
      {config.label}
    </span>
  )
}
