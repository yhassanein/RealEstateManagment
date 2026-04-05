import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, ArrowLeft, DoorOpen } from "lucide-react";
import { toast } from "sonner";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { properties, loading, createUnit, deleteUnit, deleteProperty } = useProperties();
  const property = properties.find((p) => p.id === id);

  const [unitOpen, setUnitOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unitForm, setUnitForm] = useState({ unit_number: "" });

  function handleChange(e) {
    setUnitForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleAddUnit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await createUnit(id, { unit_number: unitForm.unit_number });
      toast.success("Unit added");
      setUnitOpen(false);
      setUnitForm({ unit_number: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProperty() {
    try {
      await deleteProperty(id);
      toast.success("Property deleted");
      navigate("/owner/properties");
    } catch (err) {
      toast.error(err.message);
    }
  }

  if (loading) return <Skeleton className="h-64 w-full rounded-none" />;
  if (!property) return <p className="text-muted-foreground text-sm">Property not found.</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate("/owner/properties")}
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Property</p>
          <h1 className="text-4xl font-black tracking-tight leading-none">{property.name}</h1>
          <p className="text-sm text-muted-foreground mt-2">
            {property.address}, {property.city}, {property.state} {property.zip}
          </p>
          {property.description && (
            <p className="text-sm text-muted-foreground mt-1">{property.description}</p>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="rounded-none text-destructive hover:text-destructive border-destructive/30 text-[10px] uppercase tracking-widest font-bold">
              <Trash2 className="mr-1.5 h-3 w-3" />Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="rounded-none">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-black uppercase">Delete property?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the property and all associated units. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-none">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteProperty} className="rounded-none bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div>
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Units</p>
            <p className="text-sm font-bold mt-0.5">{property.units?.length ?? 0} total</p>
          </div>
          <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-none font-bold uppercase tracking-widest text-xs h-8">
                <Plus className="mr-1.5 h-3 w-3" />Add Unit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-none">
              <DialogHeader>
                <DialogTitle className="font-black uppercase tracking-tight">Add Unit</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddUnit} className="flex flex-col gap-4 mt-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="unit_number" className="text-[10px] font-bold uppercase tracking-wider">Unit Name</Label>
                  <Input
                    id="unit_number"
                    name="unit_number"
                    value={unitForm.unit_number}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Unit 1, Top Floor, Basement"
                    className="rounded-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" className="rounded-none text-xs uppercase tracking-widest font-bold" onClick={() => setUnitOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={saving} className="rounded-none text-xs uppercase tracking-widest font-bold">
                    {saving ? "Saving…" : "Add"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {property.units?.length === 0 ? (
          <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-14 text-center">
            <p className="text-sm text-muted-foreground">No units yet. Add the first one.</p>
          </div>
        ) : (
          <div className="grid gap-px sm:grid-cols-2 lg:grid-cols-3 bg-border">
            {property.units?.map((unit) => (
              <div key={unit.id} className="bg-white p-5 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center bg-cyan-100 shrink-0">
                    <DoorOpen className="h-4 w-4 text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-0.5">Unit</p>
                    <p className="font-black text-lg tracking-tight leading-none">{unit.unit_number}</p>
                  </div>
                </div>
                <button
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                  onClick={() => deleteUnit(unit.id).then(() => toast.success("Unit removed"))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
