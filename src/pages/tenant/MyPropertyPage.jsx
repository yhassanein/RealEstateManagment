import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, DoorOpen, Calendar } from "lucide-react";

export default function MyPropertyPage() {
  const { profile } = useAuth();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("tenants")
        .select("*, units(*), properties(*)")
        .eq("profile_id", profile.id)
        .eq("is_active", true)
        .single();
      setTenantInfo(data);
      setLoading(false);
    }
    if (profile) load();
  }, [profile]);

  if (loading) return <Skeleton className="h-64 w-full rounded-none" />;
  if (!tenantInfo)
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-border bg-white py-20 text-center">
        <p className="font-bold text-sm">No active property</p>
        <p className="text-xs text-muted-foreground mt-1">No active property assigned to your account.</p>
      </div>
    );

  const { properties: property, units: unit } = tenantInfo;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Your Residence</p>
        <h1 className="text-4xl font-black tracking-tight leading-none">{property.name}</h1>
        <div className="flex items-start gap-1.5 mt-3">
          <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {property.address}, {property.city}, {property.state} {property.zip}
          </span>
        </div>
        {property.description && (
          <p className="text-sm text-muted-foreground mt-1">{property.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 bg-border gap-px">
        <div className="bg-white p-6">
          <div className="inline-flex h-8 w-8 items-center justify-center bg-cyan-100 mb-3">
            <DoorOpen className="h-4 w-4 text-cyan-600" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Your Unit</p>
          <p className="text-4xl font-black tracking-tighter mt-1">{unit.unit_number}</p>
        </div>
        <div className="bg-white p-6">
          <div className="inline-flex h-8 w-8 items-center justify-center bg-blue-100 mb-3">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Move-in Date</p>
          <p className="text-xl font-black tracking-tight mt-1">
            {tenantInfo.move_in_date
              ? new Date(tenantInfo.move_in_date).toLocaleDateString()
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
