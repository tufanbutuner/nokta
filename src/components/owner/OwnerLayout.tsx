import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <aside className="hidden w-[220px] shrink-0 rounded-xl border bg-card p-4 lg:block">
          <Link to="/owner" className="font-brand text-xl font-bold tracking-[-0.5px] text-sheesh-ink">Owner dashboard</Link>
          <nav className="mt-6 grid gap-1">
            <OwnerNavLink to="/owner" label="Dashboard" />
            <OwnerNavLink to="/owner/venues" label="My venues" />
            <OwnerNavLink to="/owner/pricing" label="Pricing" />
            <OwnerNavLink to="/account" label="Account" />
          </nav>
          <Button asChild variant="outline" className="mt-6 w-full">
            <Link to="/">Back to Sheesha</Link>
          </Button>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

function OwnerNavLink({ to, label }: { to: string; label: string }) {
  const end = to === "/owner";

  return (
    <NavLink end={end} to={to} className={({ isActive }) => cn("rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground", isActive ? "bg-foreground text-background hover:bg-foreground hover:text-background" : "")}>
      {label}
    </NavLink>
  );
}
