import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Building2, Users, Wrench, Building, FileText } from "lucide-react";

const ownerLinks = [
  { to: "/owner/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/owner/properties", label: "Properties", icon: Building2 },
  { to: "/owner/tenants", label: "Tenants", icon: Users },
  { to: "/owner/maintenance", label: "Maintenance", icon: Wrench },
];

const tenantLinks = [
  { to: "/tenant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/tenant/property", label: "Property", icon: Building },
  { to: "/tenant/maintenance", label: "Maintenance", icon: Wrench },
  { to: "/tenant/lease", label: "Lease", icon: FileText },
];

export default function BottomNav() {
  const { profile } = useAuth();
  const links = profile?.role === "owner" ? ownerLinks : tenantLinks;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex h-16 border-t border-border bg-white/90 backdrop-blur-md">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              "flex flex-1 flex-col items-center justify-center gap-1 transition-colors duration-100",
              isActive ? "text-foreground" : "text-muted-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn("h-5 w-5", isActive ? "text-foreground" : "text-muted-foreground")} />
              <span className={cn("text-[9px] font-bold uppercase tracking-[0.15em]", isActive ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
