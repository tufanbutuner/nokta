import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { getOwnerVenueSubscription } from "@/services/ownerSubscriptionService";
import type { VenuePlan } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

const VENUE_TABS = [
  { label: "Profile", path: "profile" },
  { label: "Menu & pricing", path: "menu" },
  { label: "Photos", path: "photos" },
  { label: "Hours & bookings", path: "bookings" },
  { label: "Performance", path: "performance" },
] as const;

export function OwnerVenueTabShell({
  venue,
  title,
  actions,
  children,
  canNavigate,
}: {
  venue: Venue;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
  canNavigate?: () => boolean;
}) {
  const { user } = useAuth();
  const [plan, setPlan] = useState<VenuePlan>("free");

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getOwnerVenueSubscription({ userId: user.id, venueId: venue.id })
      .then((subscription) => {
        if (!cancelled && subscription) setPlan(subscription.plan);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [user, venue.id]);

  return (
    <div className="-mx-4 -my-5 sm:-mx-6 lg:-mx-8">
      <header className="border-b bg-white px-4 pt-4 sm:px-6 lg:px-[26px]">
        <p className="text-[12.5px] text-muted-foreground">
          <Link to="/owner/venues" className="font-medium text-clay-accent hover:underline">My venues</Link>
          <span aria-hidden="true"> / </span>
          {venue.name}
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-brand text-[25px] font-bold tracking-[-0.4px] text-nokta-ink">{title}</h1>
            <div className="mt-[5px] flex flex-wrap items-center gap-x-2 gap-y-1 text-[12.5px] text-nokta-ink-muted">
              <span>{venue.area}, {venue.city}</span>
              <span aria-hidden="true" className="opacity-45">·</span>
              <span className="inline-flex items-center gap-[5px]">
                <span aria-hidden="true" className={cn("size-1.5 rounded-full", venue.isClaimed ? "bg-forest-400" : "bg-clay-300")} />
                {venue.isClaimed ? "Claim confirmed" : "Claim pending"}
              </span>
              <span aria-hidden="true" className="opacity-45">·</span>
              <span className="rounded-full bg-nokta-accent-tint px-[7px] py-px text-[11.5px] font-semibold uppercase tracking-[0.02em] text-nokta-accent-dark">{plan} plan</span>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        <nav aria-label={`${venue.name} management`} className="mt-4 flex gap-[22px] overflow-x-auto overflow-y-hidden scrollbar-none text-[13.5px]">
          {VENUE_TABS.map((tab) => (
            <NavLink
              key={tab.path}
              to={`/owner/venues/${venue.slug}/${tab.path}`}
              onClick={(event) => {
                if (canNavigate && !canNavigate()) event.preventDefault();
              }}
              className={({ isActive }) => cn(
                "shrink-0 border-b-2 border-transparent pb-[10px] text-muted-foreground transition-colors hover:text-nokta-ink",
                isActive && "border-clay-accent font-semibold text-nokta-ink",
              )}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <div className="px-4 py-5 sm:px-6 lg:px-[26px]">{children}</div>
    </div>
  );
}
