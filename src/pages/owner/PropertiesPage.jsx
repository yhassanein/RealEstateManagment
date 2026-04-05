import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProperties } from '@/hooks/useProperties'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, MapPin, ArrowUpRight, Building2 } from 'lucide-react'
import { toast } from 'sonner'

export default function PropertiesPage() {
  const navigate = useNavigate()
  const { properties, loading, createProperty } = useProperties()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', state: '', zip: '', description: '' })

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await createProperty(form)
      toast.success('Property added')
      setOpen(false)
      setForm({ name: '', address: '', city: '', state: '', zip: '', description: '' })
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
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Portfolio</p>
          <h1 className="text-4xl font-black tracking-tight leading-none">Properties</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none font-bold uppercase tracking-widest text-xs h-9">
              <Plus className="mr-2 h-3.5 w-3.5" />Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-none">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tight">Add Property</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider">Property Name</Label>
                <Input id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Sunset Apartments" className="rounded-none" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="address" className="text-[10px] font-bold uppercase tracking-wider">Street Address</Label>
                <Input id="address" name="address" value={form.address} onChange={handleChange} required placeholder="123 Main St" className="rounded-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 flex flex-col gap-1.5">
                  <Label htmlFor="city" className="text-[10px] font-bold uppercase tracking-wider">City</Label>
                  <Input id="city" name="city" value={form.city} onChange={handleChange} required className="rounded-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="state" className="text-[10px] font-bold uppercase tracking-wider">State</Label>
                  <Input id="state" name="state" value={form.state} onChange={handleChange} required maxLength={2} placeholder="CA" className="rounded-none" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="zip" className="text-[10px] font-bold uppercase tracking-wider">ZIP</Label>
                  <Input id="zip" name="zip" value={form.zip} onChange={handleChange} required className="rounded-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-wider">Notes (optional)</Label>
                <Textarea id="description" name="description" value={form.description} onChange={handleChange} rows={3} className="rounded-none" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-none text-xs uppercase tracking-widest font-bold" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-none text-xs uppercase tracking-widest font-bold">{saving ? 'Saving…' : 'Add Property'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-border">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48 rounded-none bg-white" />)}
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-20 text-center">
          <p className="font-bold text-sm">No properties yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add your first property to get started.</p>
        </div>
      ) : (
        <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-border">
          {properties.map((property) => (
            <div
              key={property.id}
              className="bg-white p-6 cursor-pointer hover:bg-muted/40 transition-colors group"
              onClick={() => navigate(`/owner/properties/${property.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-9 w-9 items-center justify-center bg-violet-100">
                  <Building2 className="h-4.5 w-4.5 text-violet-600" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <p className="font-black text-lg leading-tight tracking-tight">{property.name}</p>
              <div className="flex items-start gap-1.5 mt-2">
                <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground">{property.address}, {property.city}, {property.state} {property.zip}</span>
              </div>
              {property.description && (
                <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{property.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
