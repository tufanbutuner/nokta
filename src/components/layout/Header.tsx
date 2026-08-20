import { PageContainer } from "@/components/layout/PageContainer";
import { Link, NavLink } from "react-router-dom";

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <PageContainer className="flex h-16 items-center justify-between">
        <Link reloadDocument to="/" className="text-sm font-semibold uppercase tracking-[0.18em]">
          Shisha London
        </Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <NavLink reloadDocument to="/discover" className={({ isActive }) => (isActive ? "text-foreground" : "hover:text-foreground")}>
            Discover
          </NavLink>
          <a href="#about" className="hover:text-foreground">
            About
          </a>
        </nav>
      </PageContainer>
    </header>
  );
}
