import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTenants } from "@/hooks/useTenants";
import { useProperties } from "@/hooks/useProperties";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";

export default function TenantsPage() {
  const navigate = useNavigate();
  const { tenants, loading, createTenant } = useTenants();
  const { properties } = useProperties();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", password: "", unit_id: "", property_id: "", move_in_date: "",
  });

  const allUnits = properties.flatMap((p) =>
    (p.units ?? []).map((u) => ({ ...u, propertyName: p.name, property_id: p.id })),
  );

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "unit_id") {
      const unit = allUnits.find((u) => u.id === value);
      setForm((prev) => ({ ...prev, unit_id: value, property_id: unit?.property_id ?? "" }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createTenant(form);
      toast.success("Tenant account created");
      setOpen(false);
      setForm({ full_name: "", email: "", password: "", unit_id: "", property_id: "", move_in_date: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  const activeTenants = tenants.filter((t) => t.is_active);
  const inactiveTenants = tenants.filter((t) => !t.is_active);

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Residents</p>
          <h1 className="text-4xl font-black tracking-tight leading-none">Tenants</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-none font-bold uppercase tracking-widest text-xs h-9">
              <Plus className="mr-2 h-3.5 w-3.5" />Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-none">
            <DialogHeader>
              <DialogTitle className="font-black uppercase tracking-tight">Add Tenant</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
              {[
                { label: 'Full Name', name: 'full_name', type: 'text', placeholder: 'Jane Smith' },
                { label: 'Email', name: 'email', type: 'email', placeholder: '' },
                { label: 'Temporary Password', name: 'password', type: 'password', placeholder: '', minLength: 6 },
              ].map(({ label, name, type, placeholder, minLength }) => (
                <div key={name} className="flex flex-col gap-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider">{label}</Label>
                  <Input name={name} type={type} value={form[name]} onChange={handleChange} required placeholder={placeholder} minLength={minLength} className="rounded-none" />
                </div>
              ))}
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Assign to Unit</Label>
                <select
                  name="unit_id"
                  value={form.unit_id}
                  onChange={handleChange}
                  required
                  className="flex h-9 w-full border border-input bg-transparent px-3 py-1 text-sm rounded-none"
                >
                  <option value="">Select a unit…</option>
                  {allUnits.map((u) => (
                    <option key={u.id} value={u.id}>{u.propertyName} — {u.unit_number}</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Move-in Date (optional)</Label>
                <Input name="move_in_date" type="date" value={form.move_in_date} onChange={handleChange} className="rounded-none" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" className="rounded-none text-xs uppercase tracking-widest font-bold" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="rounded-none text-xs uppercase tracking-widest font-bold">
                  {saving ? "Creating…" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="space-y-px bg-border">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-none bg-white" />)}
        </div>
      ) : tenants.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-20 text-center">
          <p className="font-bold text-sm">No tenants yet</p>
          <p className="text-xs text-muted-foreground mt-1">Add a tenant to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTenants.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Active — {activeTenants.length}
              </p>
              <div className="bg-border divide-y-0 gap-px flex flex-col">
                {activeTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="bg-white px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors group"
                    onClick={() => navigate(`/owner/tenants/${tenant.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center bg-emerald-100 text-emerald-700 text-xs font-black shrink-0">
                        {tenant.profiles?.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tenant.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.properties?.name} · {tenant.units?.unit_number}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
          {inactiveTenants.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
                Past — {inactiveTenants.length}
              </p>
              <div className="gap-px flex flex-col bg-border">
                {inactiveTenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className="bg-white px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors opacity-50 hover:opacity-70 group"
                    onClick={() => navigate(`/owner/tenants/${tenant.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center bg-muted text-muted-foreground text-xs font-black shrink-0">
                        {tenant.profiles?.full_name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{tenant.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.properties?.name} · {tenant.units?.unit_number}</p>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
