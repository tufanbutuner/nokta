import { ArrowLeft, Building2, CreditCard, Home, Inbox, LayoutDashboard, Megaphone, Menu, PanelLeftClose, PanelLeftOpen, UserCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { getOwnerNeedsReplyCount } from "@/services/ownerHomeSummaryService";

const OWNER_NAV_ITEMS = [
  { label: "Home", to: "/owner", icon: LayoutDashboard },
  { label: "My venues", to: "/owner/venues", icon: Building2 },
  { label: "Inbox", to: "/owner/inbox", icon: Inbox, badge: "inbox" },
  { label: "Marketing", to: "/owner/promotions", icon: Megaphone },
  { label: "Plan & billing", to: "/owner/billing", icon: CreditCard },
  { label: "Account", to: "/account", icon: UserCircle },
] as const;

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("sheesh-owner-sidebar-collapsed") === "true");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [needsReplyCount, setNeedsReplyCount] = useState(0);
  const initials = getInitials(user?.email);

  useEffect(() => {
    localStorage.setItem("sheesh-owner-sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = () => {
      getOwnerNeedsReplyCount({ userId: user.id })
        .then((count) => {
          if (!cancelled) setNeedsReplyCount(count);
        })
        .catch(() => {
          if (!cancelled) setNeedsReplyCount(0);
        });
    };
    load();
    const interval = window.setInterval(load, 60_000);
    window.addEventListener("owner-inbox-updated", load);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("owner-inbox-updated", load);
    };
  }, [user]);

  return (
    <main className="h-screen overflow-hidden bg-nokta-page-bg font-primary text-nokta-ink">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <div className="shrink-0 lg:hidden">
          <div className="border-b bg-nokta-ink text-clay-50 shadow-sm">
            <div className="flex h-14 items-center justify-between gap-3 px-4">
              <Link to="/" className="flex items-center gap-2 font-wordmark text-xl font-bold tracking-[0.02em] text-clay-400">
                <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden="true" />
                <span>nokta</span>
              </Link>
              <div className="flex items-center gap-2">
                <NotificationBell className="relative text-clay-50/80" />
                <Button type="button" variant="ghost" size="icon" className="text-clay-50/80 hover:bg-clay-400/10 hover:text-clay-200" aria-label={isMobileOpen ? "Close owner menu" : "Open owner menu"} onClick={() => setIsMobileOpen((next) => !next)}>
                  {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
            {isMobileOpen ? (
              <div className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-white/10 px-3 py-3">
                <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[2px] text-clay-50/40">Owner</div>
                <nav className="grid gap-1">
                  {OWNER_NAV_ITEMS.map((item) => (
                    <OwnerNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} badgeCount={"badge" in item ? needsReplyCount : 0} compact onClick={() => setIsMobileOpen(false)} />
                  ))}
                </nav>
                <NavLink to="/" onClick={() => setIsMobileOpen(false)} className="mt-4 flex items-center gap-3 rounded-lg bg-clay-400/10 px-3 py-3 text-sm font-medium text-clay-200">
                  <Home className="h-4 w-4" />
                  Back to nokta
                </NavLink>
                <div className="mt-4 border-t border-white/10 px-3 pt-4 text-xs text-clay-50/50">{user?.email ?? "Signed in"}</div>
              </div>
            ) : null}
          </div>
        </div>
        <aside className={cn("hidden shrink-0 flex-col bg-nokta-ink px-4 py-5 text-clay-50 transition-[width] duration-200 lg:flex", isCollapsed ? "w-[76px]" : "w-[220px]")}>
          <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center" : "justify-between")}>
            <NavLink to="/" className={cn("flex items-center gap-2 font-wordmark text-xl font-bold tracking-[0.02em] text-clay-400", isCollapsed ? "sr-only" : "")}>
              <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden="true" />
              <span>nokta</span>
            </NavLink>
            <div className="flex items-center gap-1">
              {!isCollapsed ? <NotificationBell align="left" className="relative text-clay-50/70" /> : null}
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
          </div>
          <div className={cn("mt-8 text-[10px] font-semibold uppercase tracking-[2px] text-[#8a7e7266]", isCollapsed ? "sr-only" : "")}>Owner</div>
          <nav className="mt-6 grid gap-1">
            {OWNER_NAV_ITEMS.map((item) => (
              <OwnerNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} badgeCount={"badge" in item ? needsReplyCount : 0} collapsed={isCollapsed} />
            ))}
          </nav>
          <div className="mt-auto border-t border-white/10 pt-4">
            <NavLink
              to="/"
              title="Back to nokta"
              className={cn(
                "mb-4 flex items-center gap-3 rounded-lg bg-clay-400/10 px-3 py-[9px] text-[13px] font-medium text-clay-200 transition-colors hover:bg-clay-400/15",
                isCollapsed ? "justify-center px-0" : "",
              )}
            >
              <ArrowLeft className="h-[15px] w-[15px] shrink-0" />
              <span className={isCollapsed ? "sr-only" : ""}>Back to nokta</span>
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

function OwnerNavLink({ to, label, icon: Icon, badgeCount = 0, compact = false, collapsed = false, onClick }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; badgeCount?: number; compact?: boolean; collapsed?: boolean; onClick?: () => void }) {
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
      {badgeCount > 0 ? (
        <span className={cn("rounded-full bg-clay-accent px-[6px] py-px text-[10.5px] font-semibold text-white", collapsed && !compact ? "sr-only" : "ml-auto")}>{badgeCount}</span>
      ) : null}
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
