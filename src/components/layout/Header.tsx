import { PageContainer } from "@/components/layout/PageContainer";
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
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
        <PageContainer className="flex h-16 items-center justify-between">
          <Link reloadDocument to="/" className="text-sm font-semibold uppercase tracking-[0.18em]">
            Sheesha
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <NavLink reloadDocument to="/discover" className={navLinkClass}>
              Discover
            </NavLink>
            <NavLink reloadDocument to="/recommend" className={navLinkClass}>
              Recommend
            </NavLink>
            <NavLink reloadDocument to="/saved" className={navLinkClass}>
              {savedLabel}
            </NavLink>
            {user ? (
              <>
                <NavLink reloadDocument to="/account" className={navLinkClass}>
                  Account
                </NavLink>
                {isAdmin ? (
                  <NavLink reloadDocument to="/admin/venues" className={navLinkClass}>
                    Admin
                  </NavLink>
                ) : null}
              </>
            ) : (
              <NavLink reloadDocument to="/sign-in" className={navLinkClass}>
                Sign in
              </NavLink>
            )}
          </nav>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </PageContainer>
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
                <NavLink reloadDocument to="/admin/venues" className={mobileNavLinkClass}>
                  Admin
                </NavLink>
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
