import { Activity, BarChart3, ClipboardPenLine, CreditCard, LayoutDashboard, MapPin, MessageSquare } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export const ADMIN_NAV_ITEMS = [
  { label: "Venues", to: "/admin/venues", icon: MapPin },
  // All six approve/reject workflows now live behind one queue.
  { label: "Review queue", to: "/admin/review", icon: ClipboardPenLine },
  { label: "Demand", to: "/admin/demand", icon: MessageSquare },
  { label: "Commercial", to: "/admin/commercial", icon: CreditCard },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Data Quality", to: "/admin/data-quality", icon: Activity },
] as const;

export function AdminSidebar({ activePath = "/admin/monetisation" }: { activePath?: string }) {
  const { user } = useAuth();
  const initials = getInitials(user?.email);

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col bg-nokta-ink px-4 py-5 text-clay-50 lg:flex">
      <NavLink to="/" className="flex items-center gap-2 font-wordmark text-xl font-bold tracking-[0.02em] text-clay-400">
        <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden="true" />
        <span>nokta</span>
      </NavLink>
      <div className="mt-8 text-[10px] font-semibold uppercase tracking-[2px] text-[#8a7e7266]">Admin</div>
      <nav className="mt-3 grid gap-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = item.to === activePath;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive: routeIsActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13px] font-normal text-clay-50/80 transition-colors hover:bg-clay-400/10 hover:text-clay-200",
                  isActive || routeIsActive ? "bg-clay-400/15 font-medium text-clay-200" : "",
                )
              }
            >
              <Icon className="h-[15px] w-[15px]" />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4">
        <NavLink
          to="/owner"
          className="mb-4 flex items-center gap-3 rounded-lg bg-clay-400/10 px-3 py-[9px] text-[13px] font-medium text-clay-200 transition-colors hover:bg-clay-400/15"
        >
          <LayoutDashboard className="h-[15px] w-[15px]" />
          Owner dashboard
        </NavLink>
        <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-400 text-[11px] font-bold text-white">{initials}</div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-clay-50">Admin</div>
          <div className="truncate text-[11px] text-clay-50/50">{user?.email ?? "Signed in"}</div>
        </div>
        </div>
      </div>
    </aside>
  );
}

function getInitials(email?: string) {
  const name = email?.split("@")[0] ?? "admin";
  return name
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
