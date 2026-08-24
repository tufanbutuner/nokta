import { NavLocationControl } from "@/components/location/NavLocationControl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

export function Header() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { favouriteVenueIds } = useVenuePreferences();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const savedLabel = favouriteVenueIds.length > 0 ? `Saved (${favouriteVenueIds.length})` : "Saved";
  const navLinkClass = ({ isActive }: { isActive: boolean }) => (isActive ? "text-foreground" : "hover:text-foreground");
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center justify-between border-b border-border py-4 text-base font-medium transition-colors",
      isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
    );

  return (
    <>
      <header className="sticky top-0 z-[1200] border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-6">
            <Link reloadDocument to="/" className="shrink-0 text-sm font-semibold uppercase tracking-[0.18em]">
              Sheesha
            </Link>
            <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
              <NavLink reloadDocument to="/discover" className={navLinkClass}>
                Discover
              </NavLink>
              <NavLocationControl />
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <NavLink reloadDocument to="/recommend" className={navLinkClass}>
              Recommend
            </NavLink>
            <NavLink reloadDocument to="/saved" className={navLinkClass}>
              {savedLabel}
            </NavLink>
            {user ? (
              <div className="flex items-center gap-4 border-l pl-5">
                <NavLink reloadDocument to="/account" className={navLinkClass}>
                  Account
                </NavLink>
                {isAdmin ? (
                  <>
                    <NavLink reloadDocument to="/admin/venues" className={navLinkClass}>
                      Admin
                    </NavLink>
                    <NavLink reloadDocument to="/admin/reviews" className={navLinkClass}>
                      Reviews
                    </NavLink>
                  </>
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
                  <NavLink reloadDocument to="/admin/reviews" className={mobileNavLinkClass}>
                    Reviews
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
