import { Menu, Moon, PanelLeftClose, PanelLeftOpen, Sun, UserCircle } from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Wordmark } from "@/components/layout/Wordmark";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

type IconType = ComponentType<{ className?: string }>;

export interface WorkspaceNavItem {
  label: string;
  to: string;
  icon: IconType;
  /** Items waiting on the person; shown as a badge, or a dot when collapsed. */
  badgeCount?: number;
  /** Match the path exactly rather than as a prefix. */
  end?: boolean;
}

/**
 * The owner and admin workspace shell: the site's light chrome turned on its
 * side, so working screens read as part of nokta rather than a separate tool.
 *
 * `fullWidth` drops the content padding and max-width so a child can paint
 * edge-to-edge (e.g. the venue header band); the child then owns its own
 * centring.
 */
export function WorkspaceShell({
  tag,
  homeTo,
  label,
  navItems,
  footerItems,
  activePath,
  storageKey,
  fullWidth = false,
  children,
}: {
  /** Short name of the workspace, shown beside the wordmark. */
  tag: string;
  homeTo: string;
  /** Accessible name for the sidebar landmark. */
  label: string;
  navItems: WorkspaceNavItem[];
  /** Links that leave the workspace, pinned above the account row. */
  footerItems: WorkspaceNavItem[];
  /** Forces an item active when the route sits outside its path (e.g. a detail page). */
  activePath?: string;
  storageKey: string;
  fullWidth?: boolean;
  children: ReactNode;
}) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem(storageKey) === "true");
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const waiting = navItems.reduce((total, item) => total + (item.badgeCount ?? 0), 0);
  const initials = getInitials(user?.email);

  useEffect(() => {
    localStorage.setItem(storageKey, String(isCollapsed));
  }, [isCollapsed, storageKey]);

  return (
    <main className="fixed inset-0 overflow-hidden bg-background font-primary text-nokta-ink">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <header className="shrink-0 border-b border-nokta-border bg-nokta-surface-alt/90 backdrop-blur lg:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <WorkspaceBrand tag={tag} homeTo={homeTo} />
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative rounded-full"
                aria-label={waiting > 0 ? `Open ${tag.toLowerCase()} menu, ${waiting} waiting` : `Open ${tag.toLowerCase()} menu`}
                aria-expanded={isMobileOpen}
                onClick={() => setIsMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
                {waiting > 0 ? <span aria-hidden="true" className="absolute right-2 top-2 size-2 rounded-full bg-nokta-accent-solid ring-2 ring-nokta-surface-alt" /> : null}
              </Button>
            </div>
          </div>
        </header>

        <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
          <SheetHeader>
            <SheetTitle className="text-nokta-ink">
              <WorkspaceBrand tag={tag} homeTo={homeTo} asLink={false} />
            </SheetTitle>
            <SheetClose onClick={() => setIsMobileOpen(false)} aria-label={`Close ${tag.toLowerCase()} menu`} />
          </SheetHeader>
          <nav aria-label={label} className="-mx-2 flex flex-col gap-0.5">
            {navItems.map((item) => (
              <WorkspaceNavLink key={item.to} item={item} forceActive={item.to === activePath} onClick={() => setIsMobileOpen(false)} />
            ))}
          </nav>
          <div className="-mx-2 mt-3 flex flex-col gap-0.5 border-t border-nokta-divider pt-3">
            <WorkspaceNavLink item={{ label: "Your account", to: "/account", icon: UserCircle, end: true }} onClick={() => setIsMobileOpen(false)} />
            <button type="button" onClick={toggleTheme} className={navItemClass(false)}>
              {theme === "dark" ? <Sun aria-hidden="true" className="size-[18px] shrink-0 text-nokta-ink-muted" /> : <Moon aria-hidden="true" className="size-[18px] shrink-0 text-nokta-ink-muted" />}
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            {footerItems.map((item) => (
              <WorkspaceNavLink key={item.to} item={item} onClick={() => setIsMobileOpen(false)} />
            ))}
          </div>
          <p className="mt-4 truncate border-t border-nokta-divider pt-4 text-sm text-nokta-ink-muted">{user?.email ?? "Signed in"}</p>
        </Sheet>

        <aside
          aria-label={label}
          className={cn(
            "hidden shrink-0 flex-col border-r border-nokta-border bg-nokta-surface-alt px-3 py-4 transition-[width] duration-200 ease-out lg:flex",
            isCollapsed ? "w-[72px]" : "w-[244px]",
          )}
        >
          <div className={cn("flex min-h-10 items-center gap-1", isCollapsed ? "flex-col" : "justify-between pl-2")}>
            {isCollapsed ? null : <WorkspaceBrand tag={tag} homeTo={homeTo} />}
            <div className={cn("flex items-center gap-0.5", isCollapsed && "flex-col")}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 shrink-0 rounded-full text-nokta-ink-muted hover:bg-nokta-hover hover:text-nokta-ink"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setIsCollapsed((next) => !next)}
              >
                {isCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </Button>
              <NotificationBell align="left" className="relative text-nokta-ink-muted" />
            </div>
          </div>

          <nav aria-label={label} className="mt-6 flex flex-col gap-0.5 overflow-y-auto">
            {navItems.map((item) => (
              <WorkspaceNavLink key={item.to} item={item} forceActive={item.to === activePath} collapsed={isCollapsed} />
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-0.5 border-t border-nokta-divider pt-3">
            {footerItems.map((item) => (
              <WorkspaceNavLink key={item.to} item={item} collapsed={isCollapsed} />
            ))}
            <div className={cn("mt-2 flex items-center gap-2", isCollapsed ? "flex-col" : "pl-1")}>
              <Link
                to="/account"
                title="Your account"
                className={cn(
                  "flex min-w-0 flex-1 items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-nokta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isCollapsed && "flex-none",
                )}
              >
                <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-nokta-ink font-brand text-xs font-bold text-nokta-surface">{initials}</span>
                <span className={cn("min-w-0", isCollapsed && "sr-only")}>
                  <span className="block text-sm font-semibold text-nokta-ink">Your account</span>
                  <span className="block truncate text-xs text-nokta-ink-muted">{user?.email ?? "Signed in"}</span>
                </span>
              </Link>
              <ThemeToggle />
            </div>
          </div>
        </aside>

        {fullWidth ? (
          <section className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</section>
        ) : (
          <section className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
            <div className="mx-auto w-full max-w-[1440px]">{children}</div>
          </section>
        )}
      </div>
    </main>
  );
}

/** Wordmark plus a quiet workspace tag, so it's clear which side of nokta you're on. */
function WorkspaceBrand({ tag, homeTo, asLink = true }: { tag: string; homeTo: string; asLink?: boolean }) {
  const content = (
    <>
      <Wordmark />
      <span className="rounded-full bg-nokta-chip-tint px-2 py-0.5 text-[11px] font-semibold text-nokta-accent-dark">{tag}</span>
    </>
  );
  if (!asLink) return <span className="flex items-center gap-2">{content}</span>;
  return (
    <Link to={homeTo} aria-label={`${tag} home`} className="flex items-center gap-2 rounded-md text-nokta-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {content}
    </Link>
  );
}

function navItemClass(isActive: boolean, collapsed = false) {
  return cn(
    "relative flex min-h-11 shrink-0 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-h-10",
    isActive ? "bg-nokta-chip-tint text-nokta-ink" : "text-nokta-ink-muted hover:bg-nokta-hover hover:text-nokta-ink",
    collapsed && "justify-center px-0",
  );
}

function WorkspaceNavLink({ item, forceActive = false, collapsed = false, onClick }: { item: WorkspaceNavItem; forceActive?: boolean; collapsed?: boolean; onClick?: () => void }) {
  const { label, to, icon: Icon, badgeCount = 0 } = item;
  return (
    <NavLink end={item.end ?? to === "/"} to={to} onClick={onClick} title={collapsed ? label : undefined} className={({ isActive }) => navItemClass(isActive || forceActive, collapsed)}>
      {({ isActive: routeActive }) => {
        const isActive = routeActive || forceActive;
        return (
          <>
            <Icon className={cn("size-[18px] shrink-0", isActive ? "text-nokta-accent-dark" : "text-nokta-ink-muted")} />
            <span className={cn("truncate", collapsed && "sr-only", isActive && "font-semibold")}>{label}</span>
            {badgeCount > 0 ? (
              collapsed ? (
                <span className="absolute right-3 top-2 size-2 rounded-full bg-nokta-accent-solid ring-2 ring-nokta-surface-alt">
                  <span className="sr-only">{badgeCount} waiting</span>
                </span>
              ) : (
                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-nokta-accent-solid px-1.5 text-[11px] font-semibold tabular-nums text-white">
                  {badgeCount}
                  <span className="sr-only"> waiting</span>
                </span>
              )
            ) : null}
          </>
        );
      }}
    </NavLink>
  );
}

function getInitials(email?: string) {
  const name = email?.split("@")[0] ?? "";
  const initials = name
    .split(/[._-]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
  return initials || "N";
}
