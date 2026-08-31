import { NavLocationControl } from "@/components/location/NavLocationControl";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import { Activity, BadgeCheck, BarChart3, Bell, BookOpenCheck, Building2, Camera, ChevronDown, CreditCard, GitBranch, Inbox, LayoutDashboard, Megaphone, Menu, PenLine, ShieldCheck, Sparkles, Tag, UserCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";

export function Header() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { favouriteVenueIds } = useVenuePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const savedLabel = favouriteVenueIds.length > 0 ? `Saved (${favouriteVenueIds.length})` : "Saved";
  const navLinkClass = ({ isActive }: { isActive: boolean }) => (isActive ? "text-foreground" : "hover:text-foreground");
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
      <header className="sticky top-0 z-[1200] border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link reloadDocument to="/" className="shrink-0 font-brand text-xl font-bold tracking-[-0.5px]">
              slice.
            </Link>
            <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <NavLink reloadDocument to="/discover" className={navLinkClass}>
                Discover
              </NavLink>
              <NavLink reloadDocument to="/recommend" className={navLinkClass}>
                Recommend
              </NavLink>
              <NavLink reloadDocument to="/saved" className={navLinkClass}>
                {savedLabel}
              </NavLink>
              <NavLink reloadDocument to="/suggest" className={navLinkClass}>
                Suggest
              </NavLink>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
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
                    <NavLink reloadDocument end to="/account" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <UserCircle className="h-4 w-4" />
                      Account settings
                    </NavLink>
                    <NavLink reloadDocument to="/account/bookings" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <BookOpenCheck className="h-4 w-4" />
                      My bookings
                    </NavLink>
                    <NavLink reloadDocument to="/account/notifications" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <Bell className="h-4 w-4" />
                      Notifications
                    </NavLink>
                    <div className="my-2 border-t" />
                    <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      <LayoutDashboard className="h-3.5 w-3.5" />
                      Owner
                    </div>
                    <NavLink reloadDocument to="/owner" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <LayoutDashboard className="h-4 w-4" />
                      Owner dashboard
                    </NavLink>
                    <NavLink reloadDocument to="/owner/enquiries" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <Inbox className="h-4 w-4" />
                      Owner enquiries
                    </NavLink>
                    <NavLink reloadDocument to="/owner/promotions" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <Megaphone className="h-4 w-4" />
                      Promotions
                    </NavLink>
                    <NavLink reloadDocument to="/owner/billing" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                      <CreditCard className="h-4 w-4" />
                      Billing
                    </NavLink>
                    {isAdmin ? (
                      <>
                        <div className="my-2 border-t" />
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Admin
                        </div>
                        <NavLink reloadDocument to="/admin/venues" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <Building2 className="h-4 w-4" />
                          Manage venues
                        </NavLink>
                        <NavLink reloadDocument to="/admin/data-quality" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <Activity className="h-4 w-4" />
                          Data quality
                        </NavLink>
                        <NavLink reloadDocument to="/admin/media-review" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <Camera className="h-4 w-4" />
                          Media review
                        </NavLink>
                        <NavLink reloadDocument to="/admin/reviews" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <PenLine className="h-4 w-4" />
                          Reviews
                        </NavLink>
                        <NavLink reloadDocument to="/admin/suggestions" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <GitBranch className="h-4 w-4" />
                          Suggestions
                        </NavLink>
                        <NavLink reloadDocument to="/admin/promotion-requests" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <Megaphone className="h-4 w-4" />
                          Promotion requests
                        </NavLink>
                        <NavLink reloadDocument to="/admin/claims" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <BadgeCheck className="h-4 w-4" />
                          Claims
                        </NavLink>
                        <NavLink reloadDocument to="/admin/featured" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <Sparkles className="h-4 w-4" />
                          Featured
                        </NavLink>
                        <NavLink reloadDocument to="/admin/offers" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <Tag className="h-4 w-4" />
                          Offers
                        </NavLink>
                        <NavLink reloadDocument to="/admin/analytics" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <BarChart3 className="h-4 w-4" />
                          Analytics
                        </NavLink>
                        <NavLink reloadDocument to="/admin/monetisation" className={accountMenuLinkClass} role="menuitem" onClick={() => setAccountMenuOpen(false)}>
                          <CreditCard className="h-4 w-4" />
                          Monetisation
                        </NavLink>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <NavLink reloadDocument to="/sign-in" className={navLinkClass}>
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
          <NavLink reloadDocument to="/discover" className={mobileNavLinkClass}>
            Discover
          </NavLink>
          <NavLink reloadDocument to="/recommend" className={mobileNavLinkClass}>
            Recommend
          </NavLink>
          <NavLink reloadDocument to="/saved" className={mobileNavLinkClass}>
            {savedLabel}
          </NavLink>
          <NavLink reloadDocument to="/suggest" className={mobileNavLinkClass}>
            Suggest
          </NavLink>
          {user ? (
            <>
              <NavLink reloadDocument end to="/account" className={mobileNavLinkClass}>
                Account
              </NavLink>
              <NavLink reloadDocument to="/account/bookings" className={mobileNavLinkClass}>
                My bookings
              </NavLink>
              <NavLink reloadDocument to="/account/notifications" className={mobileNavLinkClass}>
                Notifications
              </NavLink>
              <NavLink reloadDocument to="/owner" className={mobileNavLinkClass}>
                Owner dashboard
              </NavLink>
              <NavLink reloadDocument to="/owner/enquiries" className={mobileNavLinkClass}>
                Owner enquiries
              </NavLink>
              <NavLink reloadDocument to="/owner/promotions" className={mobileNavLinkClass}>
                Promotions
              </NavLink>
              <NavLink reloadDocument to="/owner/billing" className={mobileNavLinkClass}>
                Billing
              </NavLink>
              {isAdmin ? (
                <>
                  <NavLink reloadDocument to="/admin/venues" className={mobileNavLinkClass}>
                    Admin
                  </NavLink>
                  <NavLink reloadDocument to="/admin/data-quality" className={mobileNavLinkClass}>
                    Data quality
                  </NavLink>
                  <NavLink reloadDocument to="/admin/media-review" className={mobileNavLinkClass}>
                    Media review
                  </NavLink>
                  <NavLink reloadDocument to="/admin/reviews" className={mobileNavLinkClass}>
                    Reviews
                  </NavLink>
                  <NavLink reloadDocument to="/admin/suggestions" className={mobileNavLinkClass}>
                    Suggestions
                  </NavLink>
                  <NavLink reloadDocument to="/admin/promotion-requests" className={mobileNavLinkClass}>
                    Promotion requests
                  </NavLink>
                  <NavLink reloadDocument to="/admin/monetisation" className={mobileNavLinkClass}>
                    Monetisation
                  </NavLink>
                </>
              ) : null}
            </>
          ) : (
            <NavLink reloadDocument to="/sign-in" className={mobileNavLinkClass}>
              Sign in
            </NavLink>
          )}
        </nav>
      </Sheet>
    </>
  );
}
