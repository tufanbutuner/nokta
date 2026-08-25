import { NavLocationControl } from "@/components/location/NavLocationControl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import { ChevronDown, Menu, ShieldCheck, UserCircle } from "lucide-react";
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
      "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
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
            <Link reloadDocument to="/" className="shrink-0 font-brand text-sm font-semibold uppercase tracking-[0.18em]">
              Sheesha
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
              <NavLocationControl />
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {user ? (
              <div ref={accountMenuRef} className="relative border-l pl-5">
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
                    className="absolute right-0 top-12 z-[1400] w-64 rounded-xl border bg-card p-2 text-card-foreground shadow-xl"
                  >
                    <NavLink
                      reloadDocument
                      to="/account"
                      className={accountMenuLinkClass}
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                    >
                      Account settings
                    </NavLink>
                    {isAdmin ? (
                      <>
                        <div className="my-2 border-t" />
                        <div className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Admin
                        </div>
                        <NavLink
                          reloadDocument
                          to="/admin/venues"
                          className={accountMenuLinkClass}
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Manage venues
                        </NavLink>
                        <NavLink
                          reloadDocument
                          to="/admin/data-quality"
                          className={accountMenuLinkClass}
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Data quality
                        </NavLink>
                        <NavLink
                          reloadDocument
                          to="/admin/reviews"
                          className={accountMenuLinkClass}
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Reviews
                        </NavLink>
                        <NavLink
                          reloadDocument
                          to="/admin/suggestions"
                          className={accountMenuLinkClass}
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          Suggestions
                        </NavLink>
                        <NavLink
                          reloadDocument
                          to="/admin/monetisation"
                          className={accountMenuLinkClass}
                          role="menuitem"
                          onClick={() => setAccountMenuOpen(false)}
                        >
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
              <NavLink reloadDocument to="/account" className={mobileNavLinkClass}>
                Account
              </NavLink>
              {isAdmin ? (
                <>
                  <NavLink reloadDocument to="/admin/venues" className={mobileNavLinkClass}>
                    Admin
                  </NavLink>
                  <NavLink reloadDocument to="/admin/data-quality" className={mobileNavLinkClass}>
                    Data quality
                  </NavLink>
                  <NavLink reloadDocument to="/admin/reviews" className={mobileNavLinkClass}>
                    Reviews
                  </NavLink>
                  <NavLink reloadDocument to="/admin/suggestions" className={mobileNavLinkClass}>
                    Suggestions
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
