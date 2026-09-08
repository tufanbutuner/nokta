import { NavLocationControl } from "@/components/location/NavLocationControl";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import { BarChart3, Bell, BookOpenCheck, Building2, ChevronDown, ClipboardPenLine, CreditCard, Inbox, LayoutDashboard, MapPin, Megaphone, Menu, MessageSquare, ShieldCheck, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

const OWNER_MENU_ITEMS = [
  { label: "Home", to: "/owner", icon: LayoutDashboard, end: true },
  { label: "My venues", to: "/owner/venues", icon: Building2 },
  { label: "Inbox", to: "/owner/inbox", icon: Inbox },
  { label: "Marketing", to: "/owner/promotions", icon: Megaphone },
  { label: "Plan & billing", to: "/owner/billing", icon: CreditCard },
] as const;

const ADMIN_MENU_ITEMS = [
  { label: "Venues", to: "/admin/venues", icon: MapPin },
  { label: "Review queue", to: "/admin/review", icon: ClipboardPenLine },
  { label: "Demand", to: "/admin/demand", icon: MessageSquare },
  { label: "Commercial", to: "/admin/commercial", icon: CreditCard },
  { label: "Insights", to: "/admin/insights", icon: BarChart3 },
] as const;

export function Header() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { favouriteVenueIds } = useVenuePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const savedLabel = favouriteVenueIds.length > 0 ? `Saved (${favouriteVenueIds.length})` : "Saved";
  const navLinkClass = ({ isActive }: { isActive: boolean }) => (isActive ? "text-nokta-ink" : "hover:text-nokta-ink");
  const accountMenuLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
    );
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center justify-between border-b border-border py-4 text-base font-medium transition-colors",
      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    );

  useEffect(() => {
    if (!accountMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [accountMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-[1200] border-b border-nokta-border bg-nokta-surface-alt/90 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link to="/" className="shrink-0 font-wordmark text-xl font-bold tracking-[0.02em]">
              nokta
            </Link>
            <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <NavLink to="/discover" className={navLinkClass}>
                Discover
              </NavLink>
              <NavLink to="/recommend" className={navLinkClass}>
                Recommend
              </NavLink>
              <NavLink to="/saved" className={navLinkClass}>
                {savedLabel}
              </NavLink>
              <NavLink to="/for-venues" className={navLinkClass}>
                For venues
              </NavLink>
              <NavLink to="/suggest" className={navLinkClass}>
                Suggest
              </NavLink>
            </div>
          </div>
          <nav className="hidden items-center gap-3 text-sm text-muted-foreground md:flex">
            <NavLocationControl />
            <NotificationBell />
            {user ? (
              <div ref={accountMenuRef} className="relative">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:text-foreground"
                  aria-haspopup="menu"
                  aria-expanded={accountMenuOpen}
                  onClick={() => setAccountMenuOpen((isOpen) => !isOpen)}
                >
                  <UserCircle className="h-4 w-4" />
                  Account
                  <ChevronDown className={cn("h-4 w-4 transition-transform", accountMenuOpen ? "rotate-180" : "")} />
                </Button>
                {accountMenuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-12 z-[1400] max-h-[calc(100vh-5rem)] w-64 overflow-y-auto rounded-xl border bg-card p-2 text-card-foreground shadow-xl"
                  >
                    <NavLink end to="/account" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <UserCircle className="h-4 w-4" />
                      Account settings
                    </NavLink>
                    <NavLink to="/account/bookings" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <BookOpenCheck className="h-4 w-4" />
                      My bookings
                    </NavLink>
                    <NavLink to="/account/notifications" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <Bell className="h-4 w-4" />
                      Notifications
                    </NavLink>
                    <div className="my-2 border-t" />
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Owner
                    </div>
                    {OWNER_MENU_ITEMS.map((item) => {
                      const Icon = item.icon;
                      return <NavLink key={item.to} end={"end" in item ? item.end : undefined} to={item.to} className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}><Icon className="h-4 w-4" />{item.label}</NavLink>;
                    })}
                    {isAdmin ? (
                      <>
                        <div className="my-2 border-t" />
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Admin
                        </div>
                        {ADMIN_MENU_ITEMS.map((item) => {
                          const Icon = item.icon;
                          return <NavLink key={item.to} to={item.to} className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}><Icon className="h-4 w-4" />{item.label}</NavLink>;
                        })}
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <NavLink to="/sign-in" className={navLinkClass}>
                Sign in
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2 md:hidden">
            <NavLocationControl compact />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
          <SheetClose onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" />
        </SheetHeader>
        <nav className="flex flex-col">
          <NavLink to="/discover" className={mobileNavLinkClass}>
            Discover
          </NavLink>
          <NavLink to="/recommend" className={mobileNavLinkClass}>
            Recommend
          </NavLink>
          <NavLink to="/saved" className={mobileNavLinkClass}>
            {savedLabel}
          </NavLink>
          <NavLink to="/for-venues" className={mobileNavLinkClass}>
            For venues
          </NavLink>
          <NavLink to="/suggest" className={mobileNavLinkClass}>
            Suggest
          </NavLink>
          {user ? (
            <>
              <NavLink end to="/account" className={mobileNavLinkClass}>
                Account
              </NavLink>
              <NavLink to="/account/bookings" className={mobileNavLinkClass}>
                My bookings
              </NavLink>
              <NavLink to="/account/notifications" className={mobileNavLinkClass}>
                Notifications
              </NavLink>
              {OWNER_MENU_ITEMS.map((item) => <NavLink key={item.to} end={"end" in item ? item.end : undefined} to={item.to} className={mobileNavLinkClass}>{item.label}</NavLink>)}
              {isAdmin ? (
                <>
                  {ADMIN_MENU_ITEMS.map((item) => <NavLink key={item.to} to={item.to} className={mobileNavLinkClass}>{item.label}</NavLink>)}
                </>
              ) : null}
            </>
          ) : (
            <NavLink to="/sign-in" className={mobileNavLinkClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </Sheet>
    </>
  );
}
