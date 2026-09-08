import { Menu, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { AdminSidebar, ADMIN_NAV_ITEMS } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export function AdminPageShell({
  activePath,
  children,
}: {
  activePath: string;
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { user } = useAuth();

  return (
    <main className="fixed inset-0 overflow-hidden bg-nokta-page-bg font-primary text-nokta-ink">
      <div className="flex h-full min-h-0 flex-col lg:flex-row">
        <div className="shrink-0 border-b bg-nokta-ink text-clay-50 lg:hidden">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <NavLink to="/" className="flex items-center gap-2 font-wordmark text-xl font-bold tracking-[0.02em] text-clay-400">
              <span className="h-3.5 w-3.5 rounded-full bg-white" aria-hidden="true" />
              <span>nokta</span>
            </NavLink>
            <Button type="button" variant="ghost" size="icon" className="text-clay-50/80 hover:bg-clay-400/10 hover:text-clay-200" aria-label={isMobileOpen ? "Close admin menu" : "Open admin menu"} onClick={() => setIsMobileOpen((next) => !next)}>
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
          {isMobileOpen ? (
            <div className="max-h-[calc(100vh-3.5rem)] overflow-y-auto border-t border-white/10 px-3 py-3">
              <div className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[2px] text-clay-50/40">Admin</div>
              <nav className="grid gap-1">
                {ADMIN_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-clay-50/80 transition-colors hover:bg-clay-400/10 hover:text-clay-200",
                          isActive || item.to === activePath ? "bg-clay-400/15 font-medium text-clay-200" : "",
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="mt-4 border-t border-white/10 px-3 pt-4 text-xs text-clay-50/50">{user?.email ?? "Signed in"}</div>
            </div>
          ) : null}
        </div>
        <AdminSidebar activePath={activePath} />
        <section className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1440px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
