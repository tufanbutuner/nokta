import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { VenuePlan } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

const VENUE_TABS = [
  { label: "Profile", path: "profile" },
  { label: "Bookings", path: "bookings" },
  { label: "Menu & pricing", path: "menu" },
  { label: "Photos", path: "photos" },
  { label: "Performance", path: "performance" },
] as const;

/**
 * Matches the default OwnerLayout content box (1440px + its lg:px-8 gutters)
 * so venue pages line up with the rest of the owner area.
 */
const CONTENT_WIDTH = "mx-auto w-full max-w-[1504px] px-4 sm:px-6 lg:px-[26px]";

/**
 * Venue header + tab bar. The white band spans the full page width; its
 * contents stay centred. Rendered once by `OwnerVenueRouteLayout`, so it
 * stays mounted across tab switches; the active tab fills the title and
 * actions slots through `OwnerVenueTabHeader`.
 */
export function OwnerVenueTabShell({
  venue,
  plan,
  titleSlotRef,
  actionsSlotRef,
  children,
  canNavigate,
}: {
  venue: Venue;
  plan: VenuePlan;
  titleSlotRef: (node: HTMLHeadingElement | null) => void;
  actionsSlotRef: (node: HTMLDivElement | null) => void;
  children: ReactNode;
  canNavigate: () => boolean;
}) {
  return (
    <div>
      <header className="border-b bg-nokta-surface">
        <div className={cn(CONTENT_WIDTH, "pt-4")}>
          <p className="text-[12.5px] text-muted-foreground">
            <Link to="/owner/venues" className="font-medium text-clay-accent hover:underline">My venues</Link>
            <span aria-hidden="true"> / </span>
            {venue.name}
          </p>
          <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 ref={titleSlotRef} className="min-h-[1lh] font-brand text-[25px] font-bold tracking-[-0.4px] text-nokta-ink" />
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
            <div ref={actionsSlotRef} className="flex flex-wrap gap-2 empty:hidden" />
          </div>
          <nav aria-label={`${venue.name} management`} className="mt-4 flex gap-[22px] overflow-x-auto overflow-y-hidden scrollbar-none text-[13.5px]">
            {VENUE_TABS.map((tab) => (
              <NavLink
                key={tab.path}
                to={`/owner/venues/${venue.slug}/${tab.path}`}
                onClick={(event) => {
                  if (!canNavigate()) event.preventDefault();
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
        </div>
      </header>
      <div className={cn(CONTENT_WIDTH, "py-5")}>{children}</div>
    </div>
  );
}
