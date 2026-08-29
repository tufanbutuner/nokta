import { ArrowLeft, Building2, CreditCard, Home, Inbox, LayoutDashboard, UserCircle } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const OWNER_NAV_ITEMS = [
  { label: "Dashboard", compactLabel: "Dashboard", to: "/owner", icon: LayoutDashboard },
  { label: "My venues", compactLabel: "Venues", to: "/owner/venues", icon: Building2 },
  { label: "Enquiries", compactLabel: "Enquiries", to: "/owner/enquiries", icon: Inbox },
  { label: "Pricing", compactLabel: "Pricing", to: "/owner/pricing", icon: CreditCard },
  { label: "Billing", compactLabel: "Billing", to: "/owner/billing", icon: CreditCard },
  { label: "Account", compactLabel: "Account", to: "/account", icon: UserCircle },
] as const;

export function OwnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="bg-background">
      <div className="flex min-h-[calc(100vh-180px)] w-full flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:gap-6 lg:px-8 lg:py-8">
        <div className="lg:hidden">
          <div className="rounded-xl border bg-card/95 p-3 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <Link to="/owner" className="font-brand text-lg font-bold tracking-[-0.5px] text-sheesh-ink">Owner</Link>
              <Button asChild variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                <Link to="/"><Home className="h-4 w-4" /> Sheesha</Link>
              </Button>
            </div>
            <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto px-1 pb-1">
              {OWNER_NAV_ITEMS.map((item) => (
                <OwnerNavLink key={item.to} to={item.to} label={item.compactLabel} icon={item.icon} compact />
              ))}
            </nav>
          </div>
        </div>
        <aside className="hidden w-[240px] shrink-0 rounded-xl border bg-card p-4 shadow-sm lg:block">
          <Link to="/owner" className="font-brand text-xl font-bold tracking-[-0.5px] text-sheesh-ink">Owner dashboard</Link>
          <p className="mt-1 text-xs text-muted-foreground">Manage your venue profile and billing.</p>
          <nav className="mt-6 grid gap-1">
            {OWNER_NAV_ITEMS.map((item) => (
              <OwnerNavLink key={item.to} to={item.to} label={item.label} icon={item.icon} />
            ))}
          </nav>
          <Button asChild variant="ghost" className="mt-6 w-full justify-start gap-2 text-muted-foreground">
            <Link to="/"><ArrowLeft className="h-4 w-4" /> Back to Sheesha</Link>
          </Button>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}

function OwnerNavLink({ to, label, icon: Icon, compact = false }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; compact?: boolean }) {
  const end = to === "/owner";

  return (
    <NavLink
      end={end}
      to={to}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
          compact ? "shrink-0 whitespace-nowrap border bg-background/70 px-3 py-2" : "",
          isActive ? "bg-sheesh-ink text-clay-50 hover:bg-sheesh-ink hover:text-clay-50" : "",
        )
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
