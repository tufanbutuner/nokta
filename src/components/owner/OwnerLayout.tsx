import { ArrowLeft, Building2, CalendarDays, CreditCard, Inbox, LayoutDashboard, Megaphone } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { useAuth } from "@/context/AuthContext";
import { getOwnerNeedsReplyCount, getOwnerPendingBookingCount } from "@/services/ownerHomeSummaryService";

const FOOTER_ITEMS = [{ label: "Back to nokta", to: "/", icon: ArrowLeft, end: true }];

/**
 * The owner workspace. `fullWidth` drops the content padding and max-width so a
 * child can paint edge-to-edge (e.g. the venue header band); the child then
 * owns its own centring.
 */
export function OwnerLayout({ children, fullWidth = false }: { children: ReactNode; fullWidth?: boolean }) {
  const { user } = useAuth();
  const [needsReplyCount, setNeedsReplyCount] = useState(0);
  const [pendingBookingCount, setPendingBookingCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const load = () => {
      Promise.all([getOwnerNeedsReplyCount({ userId: user.id }), getOwnerPendingBookingCount({ userId: user.id })])
        .then(([replyCount, bookingCount]) => {
          if (!cancelled) {
            setNeedsReplyCount(replyCount);
            setPendingBookingCount(bookingCount);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setNeedsReplyCount(0);
            setPendingBookingCount(0);
          }
        });
    };
    load();
    const interval = window.setInterval(load, 60_000);
    window.addEventListener("owner-inbox-updated", load);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("owner-inbox-updated", load);
    };
  }, [user]);

  const navItems = [
    { label: "Home", to: "/owner", icon: LayoutDashboard, end: true },
    { label: "My venues", to: "/owner/venues", icon: Building2 },
    { label: "Bookings", to: "/owner/bookings", icon: CalendarDays, badgeCount: pendingBookingCount },
    { label: "Inbox", to: "/owner/inbox", icon: Inbox, badgeCount: needsReplyCount },
    { label: "Marketing", to: "/owner/promotions", icon: Megaphone },
    { label: "Plan & billing", to: "/owner/billing", icon: CreditCard },
  ];

  return (
    <WorkspaceShell tag="Owner" homeTo="/owner" label="Owner workspace" navItems={navItems} footerItems={FOOTER_ITEMS} storageKey="sheesh-owner-sidebar-collapsed" fullWidth={fullWidth}>
      {children}
    </WorkspaceShell>
  );
}
