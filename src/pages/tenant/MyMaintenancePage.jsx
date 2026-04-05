import { useState, useRef } from 'react'
import { useMaintenanceRequests } from '@/hooks/useMaintenanceRequests'
import StatusBadge from '@/components/maintenance/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, ImagePlus, X } from 'lucide-react'
import { toast } from 'sonner'

export default function MyMaintenancePage() {
  const { requests, loading, createRequest } = useMaintenanceRequests()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', description: '' })
  const [photos, setPhotos] = useState([])
  const [previews, setPreviews] = useState([])
  const fileRef = useRef()

  function handlePhotos(e) {
    const files = Array.from(e.target.files)
    setPhotos((prev) => [...prev, ...files])
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))])
    e.target.value = ''
  }

  function removePhoto(index) {
    URL.revokeObjectURL(previews[index])
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createRequest(form, photos)
      toast.success('Request submitted')
      setOpen(false)
      setForm({ title: '', description: '' })
      previews.forEach(URL.revokeObjectURL)
      setPhotos([])
      setPreviews([])
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Service</p>
          <h1 className="text-4xl font-black tracking-tight leading-none">Maintenance</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none font-bold uppercase tracking-widest text-xs h-9">
              <Plus className="mr-2 h-3.5 w-3.5" />New Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-none">
            <DialogHeader><DialogTitle className="font-black uppercase tracking-tight">Submit Request</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Title</Label>
                <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required placeholder="e.g. Leaking faucet in bathroom" className="rounded-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} required rows={4} placeholder="Describe the issue in detail…" className="rounded-none resize-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Photos (optional)</Label>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotos} />
                <Button type="button" variant="outline" className="rounded-none text-xs uppercase tracking-widest font-bold" onClick={() => fileRef.current.click()}>
                  <ImagePlus className="mr-2 h-3.5 w-3.5" />Add Photos
                </Button>
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-1 mt-1">
                    {previews.map((src, i) => (
                      <div key={i} className="relative">
                        <img src={src} alt="" className="object-cover w-full aspect-square" />
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-black/70 p-0.5 text-white hover:bg-black">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-none text-xs uppercase tracking-widest font-bold" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-none text-xs uppercase tracking-widest font-bold">{saving ? 'Submitting…' : 'Submit'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="bg-border gap-px flex flex-col">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-none bg-white" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-20 text-center">
          <p className="font-bold text-sm">No requests yet</p>
          <p className="text-xs text-muted-foreground mt-1">Submit a request if something needs attention.</p>
        </div>
      ) : (
        <div className="bg-border gap-px flex flex-col">
          {requests.map((req) => (
            <div key={req.id} className="bg-white px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-sm">{req.title}</p>
                    <StatusBadge status={req.status} />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{req.description}</p>
                  {req.owner_notes && (
                    <div className="mt-2 border-l-2 border-foreground pl-3 text-[11px]">
                      <span className="font-bold uppercase tracking-wider text-[9px]">Owner: </span>
                      <span className="text-muted-foreground">{req.owner_notes}</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0 font-medium">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
