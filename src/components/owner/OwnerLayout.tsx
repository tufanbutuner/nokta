import { ArrowLeft, BookOpenCheck, Building2, CalendarCog, CreditCard, Home, Inbox, LayoutDashboard, Megaphone, Menu, PanelLeftClose, PanelLeftOpen, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const OWNER_NAV_ITEMS = [
  { label: "Dashboard", compactLabel: "Dashboard", to: "/owner", icon: LayoutDashboard },
  { label: "My venues", compactLabel: "Venues", to: "/owner/venues", icon: Building2 },
  { label: "Bookings", compactLabel: "Bookings", to: "/owner/bookings", icon: BookOpenCheck },
  { label: "Availability", compactLabel: "Availability", to: "/owner/venues/sheesha-test-lounge/availability", icon: CalendarCog },
  { label: "Enquiries", compactLabel: "Enquiries", to: "/owner/enquiries", icon: Inbox },
  { label: "Promotions", compactLabel: "Promotions", to: "/owner/promotions", icon: Megaphone },
  { label: "Pricing", compactLabel: "Pricing", to: "/owner/pricing", icon: CreditCard },
  { label: "Billing", compactLabel: "Billing", to: "/owner/billing", icon: CreditCard },
  { label: "Account", compactLabel: "Account", to: "/account", icon: UserCircle },
] as const;

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("sheesh-owner-sidebar-collapsed") === "true");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const initials = getInitials(user?.email);

  useEffect(() => {
    localStorage.setItem("sheesh-owner-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  return (
    <main className="h-screen overflow-hidden bg-clay-50 font-primary text-sheesh-ink">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <div className="shrink-0 lg:hidden">
          <div className="border-b bg-sheesh-ink text-clay-50 shadow-sm">
            <div className="flex h-14 items-center justify-between gap-3 px-4">
              <Link to="/" className="font-brand text-xl font-bold tracking-[-0.5px] text-clay-400">sheesh.</Link>
              <Button type="button" variant="ghost" size="icon" className="text-clay-50/80 hover:bg-clay-400/10 hover:text-clay-200" aria-label={isMobileOpen ? "Close owner menu" : "Open owner menu"} onClick={() => setIsMobileOpen((next) => !next)}>
                {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
            {isMobileOpen ? (
              <div className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-white/10 px-3 py-3">
                <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[2px] text-clay-50/40">Owner</div>
                <nav className="grid gap-1">
                  {OWNER_NAV_ITEMS.map((item) => (
                    <OwnerNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} compact onClick={() => setIsMobileOpen(false)} />
                  ))}
                </nav>
                <NavLink to="/" onClick={() => setIsMobileOpen(false)} className="mt-4 flex items-center gap-3 rounded-lg bg-clay-400/10 px-3 py-3 text-sm font-medium text-clay-200">
                  <Home className="h-4 w-4" />
                  Back to Sheesha
                </NavLink>
                <div className="mt-4 border-t border-white/10 px-3 pt-4 text-xs text-clay-50/50">{user?.email ?? "Signed in"}</div>
              </div>
            ) : null}
          </div>
        </div>
        <aside className={cn("hidden shrink-0 flex-col bg-sheesh-ink px-4 py-5 text-clay-50 transition-[width] duration-200 lg:flex", isCollapsed ? "w-[76px]" : "w-[220px]")}>
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-between")}>
            <NavLink to="/" className={cn("font-brand text-xl font-bold tracking-[-0.5px] text-clay-400", isCollapsed ? "sr-only" : "")}>
              sheesh.
            </NavLink>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-clay-50/60 hover:bg-clay-400/10 hover:text-clay-200"
              aria-label={isCollapsed ? "Expand owner sidebar" : "Collapse owner sidebar"}
              onClick={() => setIsCollapsed((next) => !next)}
            >
              {isCollapsed ? <PanelLeftOpen className="h-[15px] w-[15px]" /> : <PanelLeftClose className="h-[15px] w-[15px]" />}
            </Button>
          </div>
          <div className={cn("mt-8 text-[10px] font-semibold uppercase tracking-[2px] text-[#8a7e7266]", isCollapsed ? "sr-only" : "")}>Owner</div>
          <nav className="mt-6 grid gap-1">
            {OWNER_NAV_ITEMS.map((item) => (
              <OwnerNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} collapsed={isCollapsed} />
            ))}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-4">
            <NavLink
              to="/"
              title="Back to Sheesha"
              className={cn(
                "mb-4 flex items-center gap-3 rounded-lg bg-clay-400/10 px-3 py-[9px] text-[13px] font-medium text-clay-200 transition-colors hover:bg-clay-400/15",
                isCollapsed ? "justify-center px-0" : "",
              )}
            >
              <ArrowLeft className="h-[15px] w-[15px] shrink-0" />
              <span className={isCollapsed ? "sr-only" : ""}>Back to Sheesha</span>
            </NavLink>
            <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "")}>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-clay-400 text-[11px] font-bold text-white">{initials}</div>
              <div className={cn("min-w-0", isCollapsed ? "sr-only" : "")}>
                <div className="truncate text-xs font-medium text-clay-50">Owner</div>
                <div className="truncate text-[11px] text-clay-50/50">{user?.email ?? "Signed in"}</div>
              </div>
            </div>
          </div>
        </aside>
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </section>
      </div>
    </main>
  );
}

function OwnerNavLink({ to, label, icon: Icon, compact = false, collapsed = false, onClick }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; compact?: boolean; collapsed?: boolean; onClick?: () => void }) {
  const end = to === "/owner";

  return (
    <NavLink
      end={end}
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-[9px] text-[13px] font-normal transition-colors",
          compact ? "py-3 text-sm text-clay-50/80 hover:bg-clay-400/10 hover:text-clay-200" : "",
          !compact ? "text-clay-50/80 hover:bg-clay-400/10 hover:text-clay-200" : "",
          collapsed && !compact ? "justify-center px-0" : "",
          isActive && compact ? "bg-clay-400/15 font-medium text-clay-200" : "",
          isActive && !compact ? "bg-clay-400/15 font-medium text-clay-200" : "",
        )
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="h-[15px] w-[15px] shrink-0" />
      <span className={collapsed && !compact ? "sr-only" : ""}>{label}</span>
    </NavLink>
  );
}

function getInitials(email?: string) {
  const name = email?.split("@")[0] ?? "owner";
  return name
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
