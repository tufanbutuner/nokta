import { Activity, BadgeCheck, BarChart3, ClipboardPenLine, DollarSign, GitBranch, Inbox, MapPin, PenLine, Sparkles, Tag } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const ADMIN_NAV_ITEMS = [
  { label: "Venues", to: "/admin/venues", icon: MapPin },
  { label: "Data Quality", to: "/admin/data-quality", icon: Activity },
  { label: "Venue Updates", to: "/admin/venue-updates", icon: ClipboardPenLine },
  { label: "Suggestions", to: "/admin/suggestions", icon: GitBranch },
  { label: "Reviews", to: "/admin/reviews", icon: PenLine },
  { label: "Claims", to: "/admin/claims", icon: BadgeCheck },
  { label: "Featured", to: "/admin/featured", icon: Sparkles },
  { label: "Enquiries", to: "/admin/enquiries", icon: Inbox },
  { label: "Offers", to: "/admin/offers", icon: Tag },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "Monetisation", to: "/admin/monetisation", icon: DollarSign },
] as const;

export function AdminSidebar({ activePath = "/admin/monetisation" }: { activePath?: string }) {
  const { user } = useAuth();
  const initials = getInitials(user?.email);

  return (
    <aside className="hidden w-[220px] shrink-0 flex-col bg-sheesh-ink px-4 py-5 text-clay-50 lg:flex">
      <NavLink to="/" className="font-brand text-xl font-bold tracking-[-0.5px] text-clay-400">
        sheesh.
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
      <div className="mt-auto flex items-center gap-3 border-t border-white/10 pt-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-clay-400 text-[11px] font-bold text-white">{initials}</div>
        <div className="min-w-0">
          <div className="truncate text-xs font-medium text-clay-50">Admin</div>
          <div className="truncate text-[11px] text-clay-50/50">{user?.email ?? "Signed in"}</div>
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
