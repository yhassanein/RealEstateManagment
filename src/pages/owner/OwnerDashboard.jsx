import { useProperties } from "@/hooks/useProperties";
import { useTenants } from "@/hooks/useTenants";
import { useMaintenanceRequests } from "@/hooks/useMaintenanceRequests";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "@/components/maintenance/StatusBadge";
import { Building2, Users, AlertCircle, Wrench } from "lucide-react";

const statMeta = [
  { icon: Building2, bg: "bg-violet-100", text: "text-violet-600" },
  { icon: Users, bg: "bg-emerald-100", text: "text-emerald-600" },
  { icon: AlertCircle, bg: "bg-amber-100", text: "text-amber-600" },
  { icon: Wrench, bg: "bg-blue-100", text: "text-blue-600" },
];

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const { properties, loading: propsLoading } = useProperties();
  const { tenants, loading: tenantsLoading } = useTenants();
  const { requests, loading: reqLoading } = useMaintenanceRequests();

  const openRequests = requests.filter((r) => r.status === "open");
  const activeTenants = tenants.filter((t) => t.is_active);

  const stats = [
    { label: "Properties", value: properties.length, loading: propsLoading },
    {
      label: "Active Tenants",
      value: activeTenants.length,
      loading: tenantsLoading,
    },
    { label: "Open Requests", value: openRequests.length, loading: reqLoading },
    { label: "Total Requests", value: requests.length, loading: reqLoading },
  ];

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
          Overview
        </p>
        <h1 className="text-4xl font-black tracking-tight leading-none">
          {profile?.full_name?.split(" ")[0]}
        </h1>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-border bg-white">
        {stats.map(({ label, value, loading }, i) => {
          const { icon: Icon, bg, text } = statMeta[i];
          return (
            <div
              key={label}
              className={`p-6 ${i < stats.length - 1 ? "border-r border-border" : ""}`}
            >
              <div
                className={`inline-flex h-8 w-8 items-center justify-center mb-3 ${bg}`}
              >
                <Icon className={`h-4 w-4 ${text}`} />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </p>
              {loading ? (
                <Skeleton className="h-10 w-16 mt-2 rounded-none" />
              ) : (
                <p className="text-5xl font-black tracking-tighter mt-1">
                  {value}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {requests.length > 0 && (
        <div>
          <p className="text-[30px] font-bold uppercase tracking-[0.2em] text-blue-300 border-b border-border mb-4">
            All Requests
          </p>
          <div className="border border-border bg-white divide-y divide-border">
            {requests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-bold text-sm">{req.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {req.tenants?.profiles?.full_name} · {req.properties?.name}{" "}
                    · {req.units?.unit_number}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <StatusBadge status={req.status} />
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
