import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/context/AuthContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Link, NavLink } from "react-router-dom";

export function Header() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { favouriteVenueIds } = useVenuePreferences();
  const savedLabel = favouriteVenueIds.length > 0 ? `Saved (${favouriteVenueIds.length})` : "Saved";

  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <PageContainer className="flex h-16 items-center justify-between">
        <Link reloadDocument to="/" className="text-sm font-semibold uppercase tracking-[0.18em]">
          Sheesha
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <NavLink reloadDocument to="/discover" className={({ isActive }) => (isActive ? "text-foreground" : "hover:text-foreground")}>
            Discover
          </NavLink>
          <NavLink reloadDocument to="/recommend" className={({ isActive }) => (isActive ? "text-foreground" : "hover:text-foreground")}>
            Recommend
          </NavLink>
          <NavLink reloadDocument to="/saved" className={({ isActive }) => (isActive ? "text-foreground" : "hover:text-foreground")}>
            {savedLabel}
          </NavLink>
          {user ? (
            <>
              <NavLink reloadDocument to="/account" className={({ isActive }) => (isActive ? "text-foreground" : "hover:text-foreground")}>
                Account
              </NavLink>
              {isAdmin ? (
                <NavLink reloadDocument to="/admin/venues" className={({ isActive }) => (isActive ? "text-foreground" : "hover:text-foreground")}>
                  Admin
                </NavLink>
              ) : null}
            </>
          ) : (
            <NavLink reloadDocument to="/sign-in" className={({ isActive }) => (isActive ? "text-foreground" : "hover:text-foreground")}>
              Sign in
            </NavLink>
          )}
        </nav>
      </PageContainer>
    </header>
  );
}
