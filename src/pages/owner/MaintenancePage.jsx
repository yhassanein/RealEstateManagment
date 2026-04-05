import { useState } from 'react'
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests'
import StatusBadge from '@/components/maintenance/StatusBadge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

const STATUSES = ['open', 'in_progress', 'resolved']

export default function MaintenancePage() {
  const { requests, loading, updateStatus, getPhotoUrl } = useMaintenanceRequests()
  const [selected, setSelected] = useState(null)
  const [ownerNotes, setOwnerNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [photoUrls, setPhotoUrls] = useState({})
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  const counts = {
    all: requests.length,
    open: requests.filter((r) => r.status === 'open').length,
    in_progress: requests.filter((r) => r.status === 'in_progress').length,
    resolved: requests.filter((r) => r.status === 'resolved').length,
  }

  async function openRequest(req) {
    setSelected(req)
    setOwnerNotes(req.owner_notes ?? '')
    const urls = {}
    for (const photo of req.maintenance_photos ?? []) {
      urls[photo.id] = await getPhotoUrl(photo.storage_path)
    }
    setPhotoUrls(urls)
  }

  async function handleUpdateStatus(status) {
    setSaving(true)
    try {
      await updateStatus(selected.id, status, ownerNotes)
      toast.success('Status updated')
      setSelected(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Service</p>
        <h1 className="text-4xl font-black tracking-tight leading-none">Maintenance</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex border border-border bg-white">
        {['all', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-[0.15em] transition-colors border-r border-border last:border-r-0 ${
              filter === s ? 'bg-foreground text-white' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
            <span className={`text-[9px] font-black ${filter === s ? 'text-white/60' : 'text-muted-foreground'}`}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-border gap-px flex flex-col">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-none bg-white" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-20 text-center">
          <p className="font-bold text-sm">No requests</p>
          <p className="text-xs text-muted-foreground mt-1">Nothing here yet.</p>
        </div>
      ) : (
        <div className="bg-border gap-px flex flex-col">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white px-5 py-4 flex items-start justify-between cursor-pointer hover:bg-muted/40 transition-colors group"
              onClick={() => openRequest(req)}
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="font-bold text-sm">{req.title}</p>
                  <StatusBadge status={req.status} />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {req.tenants?.profiles?.full_name} · {req.properties?.name} · {req.units?.unit_number}
                </p>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-4 shrink-0 font-medium">
                {new Date(req.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && (
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-none">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tight flex items-center gap-3">
                {selected.title}
                <StatusBadge status={selected.status} />
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p>{selected.tenants?.profiles?.full_name} · {selected.properties?.name} · {selected.units?.unit_number}</p>
                <p>{new Date(selected.created_at).toLocaleDateString()}</p>
              </div>

              <div className="bg-muted/50 px-4 py-3 text-sm border border-border">
                {selected.description}
              </div>

              {Object.keys(photoUrls).length > 0 && (
                <div className="grid grid-cols-2 gap-1">
                  {(selected.maintenance_photos ?? []).map((photo) => (
                    photoUrls[photo.id] && (
                      <img key={photo.id} src={photoUrls[photo.id]} alt={photo.file_name}
                        className="object-cover w-full aspect-square" />
                    )
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Your Notes</Label>
                <Textarea value={ownerNotes} onChange={(e) => setOwnerNotes(e.target.value)} rows={3} placeholder="Add notes for the tenant…" className="rounded-none resize-none" />
              </div>

              <div className="flex gap-2 flex-wrap">
                {STATUSES.filter((s) => s !== selected.status).map((s) => (
                  <Button key={s} variant="outline" size="sm" disabled={saving} onClick={() => handleUpdateStatus(s)}
                    className="rounded-none capitalize text-[10px] uppercase tracking-widest font-bold">{s.replace('_', ' ')}</Button>
                ))}
                <Button size="sm" disabled={saving} onClick={() => handleUpdateStatus(selected.status)} className="ml-auto rounded-none text-[10px] uppercase tracking-widest font-bold">
                  {saving ? 'Saving…' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}
