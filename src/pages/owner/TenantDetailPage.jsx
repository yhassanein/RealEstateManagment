import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTenants } from '@/hooks/useTenants'
import { useLeases } from '@/hooks/useLeases'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Upload, FileText, Trash2, ExternalLink, Building2, DoorOpen, Calendar } from 'lucide-react'
import { toast } from 'sonner'

export default function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { tenants, loading: tenantsLoading, deactivateTenant } = useTenants()
  const { leases, loading: leasesLoading, uploadLease, deleteLease, getLeaseUrl } = useLeases(id)

  const tenant = tenants.find((t) => t.id === id)
  const [leaseOpen, setLeaseOpen] = useState(false)
  const [leaseForm, setLeaseForm] = useState({ start_date: '', end_date: '' })
  const [leaseFile, setLeaseFile] = useState(null)
  const [saving, setSaving] = useState(false)

  async function handleUploadLease(e) {
    e.preventDefault()
    if (!leaseFile) return toast.error('Select a PDF file')
    setSaving(true)
    try {
      await uploadLease(id, leaseFile, leaseForm)
      toast.success('Lease uploaded')
      setLeaseOpen(false)
      setLeaseFile(null)
      setLeaseForm({ start_date: '', end_date: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleViewLease(storagePath) {
    const url = await getLeaseUrl(storagePath)
    if (url) window.open(url, '_blank')
  }

  async function handleDeactivate() {
    try {
      await deactivateTenant(id)
      toast.success('Tenant deactivated')
      navigate('/owner/tenants')
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (tenantsLoading) return <Skeleton className="h-64 w-full rounded-none" />
  if (!tenant) return <p className="text-muted-foreground text-sm">Tenant not found.</p>

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/owner/tenants')} className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
            {tenant.is_active ? 'Active Tenant' : 'Past Tenant'}
          </p>
          <h1 className="text-4xl font-black tracking-tight leading-none">{tenant.profiles?.full_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{tenant.profiles?.email}</p>
        </div>
        {tenant.is_active && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-none text-destructive hover:text-destructive border-destructive/30 text-[10px] uppercase tracking-widest font-bold">
                Deactivate
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black uppercase">Deactivate tenant?</AlertDialogTitle>
                <AlertDialogDescription>This marks the tenant as inactive. Their account will remain but they will lose access to active tenant features.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeactivate} className="rounded-none bg-destructive text-destructive-foreground">Deactivate</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {/* Info strip */}
      <div className="grid grid-cols-3 bg-border gap-px">
        {[
          { label: 'Property', value: tenant.properties?.name, icon: Building2, bg: 'bg-violet-100', text: 'text-violet-600' },
          { label: 'Unit', value: tenant.units?.unit_number, icon: DoorOpen, bg: 'bg-cyan-100', text: 'text-cyan-600' },
          { label: 'Move-in', value: tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : '—', icon: Calendar, bg: 'bg-blue-100', text: 'text-blue-600' },
        ].map(({ label, value, icon: Icon, bg, text }) => (
          <div key={label} className="bg-white px-5 py-4">
            <div className={`inline-flex h-7 w-7 items-center justify-center mb-2 ${bg}`}>
              <Icon className={`h-3.5 w-3.5 ${text}`} />
            </div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <p className="font-bold text-sm mt-0.5">{value}</p>
          </div>
        ))}
      </div>

      {/* Leases */}
      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Lease Documents</p>
            <p className="text-sm font-bold mt-0.5">{leases.length} on file</p>
          </div>
          <Dialog open={leaseOpen} onOpenChange={setLeaseOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-none font-bold uppercase tracking-widest text-xs h-8">
                <Upload className="mr-1.5 h-3 w-3" />Upload
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-none">
              <DialogHeader><DialogTitle className="font-black uppercase tracking-tight">Upload Lease</DialogTitle></DialogHeader>
              <form onSubmit={handleUploadLease} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">PDF File</Label>
                  <Input type="file" accept="application/pdf" onChange={(e) => setLeaseFile(e.target.files?.[0])} required className="rounded-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">Start</Label>
                    <Input type="date" value={leaseForm.start_date} onChange={(e) => setLeaseForm((p) => ({ ...p, start_date: e.target.value }))} className="rounded-none" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-wider">End</Label>
                    <Input type="date" value={leaseForm.end_date} onChange={(e) => setLeaseForm((p) => ({ ...p, end_date: e.target.value }))} className="rounded-none" />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" className="rounded-none text-xs uppercase tracking-widest font-bold" onClick={() => setLeaseOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving} className="rounded-none text-xs uppercase tracking-widest font-bold">{saving ? 'Uploading…' : 'Upload'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {leasesLoading ? (
          <Skeleton className="h-16 rounded-none" />
        ) : leases.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-12 text-center">
            <p className="text-sm text-muted-foreground">No lease uploaded yet.</p>
          </div>
        ) : (
          <div className="bg-border gap-px flex flex-col">
            {leases.map((lease) => (
              <div key={lease.id} className="bg-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center bg-blue-100 shrink-0">
                    <FileText className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{lease.file_name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {lease.start_date && lease.end_date
                        ? `${new Date(lease.start_date).toLocaleDateString()} – ${new Date(lease.end_date).toLocaleDateString()}`
                        : 'No dates set'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors" onClick={() => handleViewLease(lease.storage_path)}>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    onClick={() => deleteLease(lease.id, lease.storage_path).then(() => toast.success('Lease deleted'))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
