import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const ownerLinks = [
  { to: "/owner/dashboard", label: "Dashboard" },
  { to: "/owner/properties", label: "Properties" },
  { to: "/owner/tenants", label: "Tenants" },
  { to: "/owner/maintenance", label: "Maintenance" },
];

const tenantLinks = [
  { to: "/tenant/dashboard", label: "Dashboard" },
  { to: "/tenant/property", label: "Property" },
  { to: "/tenant/maintenance", label: "Maintenance" },
  { to: "/tenant/lease", label: "Lease" },
];

export default function Sidebar() {
  const { profile } = useAuth();
  const links = profile?.role === "owner" ? ownerLinks : tenantLinks;

  return (
    <aside className="hidden md:flex h-full w-20 flex-col border-r border-border bg-white/85 backdrop-blur-md">
      {/* Brand mark */}
      <div className="flex h-14 w-full items-center justify-center border-b border-border shrink-0">
        <div className="flex h-12 w-15 items-center justify-center bg-amber-300">
          <span className="text-[25px] font-black text-white tracking-tighter">
            H&H
          </span>
        </div>
      </div>

      {/* Nav items — equal height, vertical text */}
      <nav className="flex flex-1 flex-col pb-8">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-1 items-center justify-center transition-colors duration-100",
                isActive
                  ? "bg-foreground text-white"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <span
                style={{
                  writingMode: "vertical-rl",
                  transform: "rotate(180deg)",
                }}
                className={cn(
                  "text-[15px] font-bold uppercase tracking-[0.18em] select-none",
                  isActive ? "text-white" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
