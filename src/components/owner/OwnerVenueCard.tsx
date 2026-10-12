import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { workspacePrimaryActionClass, workspaceSecondaryActionClass } from "@/components/workspace/WorkspacePageHeader";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { PlanBadge } from "@/components/subscriptions/PlanBadge";
import { subscriptionHasPlanAccess } from "@/lib/planFeatureAccess";
import type { OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import type { OwnerVenueCommercialSummary } from "@/services/ownerCommercialSummaryService";
import type { OwnerVenueEnquirySummary } from "@/services/ownerVenueEnquirySummaryService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerVenueCard({ venue, analytics, enquiries, commercial, subscription }: { venue: Venue; analytics?: OwnerVenueAnalyticsSummary; enquiries?: OwnerVenueEnquirySummary; commercial?: OwnerVenueCommercialSummary; subscription?: VenueSubscription }) {
  const canRequestUpdate = subscriptionHasPlanAccess(subscription ?? null, "profile_update_requests");
  const canUseInbox = subscriptionHasPlanAccess(subscription ?? null, "owner_enquiry_inbox");
  const status = subscription?.status ?? "inactive";
  const links = [
    { to: `/owner/venues/${venue.slug}/bookings`, label: "Bookings" },
    { to: `/owner/venues/${venue.slug}/menu`, label: "Menu & pricing" },
    { to: `/owner/venues/${venue.slug}/performance`, label: "Performance" },
    canRequestUpdate ? { to: `/owner/venues/${venue.slug}/profile`, label: "Request profile update" } : { to: "/owner/billing#owner-plans", label: "View plans" },
    ...(canUseInbox ? [{ to: `/owner/inbox?venue=${encodeURIComponent(venue.slug)}`, label: "Enquiries" }] : []),
  ];

  return (
    <article className="overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface">
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-brand text-2xl font-bold tracking-[-0.01em] text-nokta-ink">{venue.name}</h2>
            <ClaimedVenueBadge compact />
          </div>
          <p className="mt-1 text-[15px] text-nokta-ink-muted">{venue.area}, {venue.city}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-nokta-ink-muted">
            <PlanBadge plan={subscription?.plan ?? "free"} status={status} compact />
            {status === "active" ? null : <span className="capitalize">{status.replace("_", " ")}</span>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/owner/venues/${venue.slug}/profile`} className={workspacePrimaryActionClass}>
            Manage venue
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
          <Link to={`/venues/${venue.slug}`} className={workspaceSecondaryActionClass}>
            Public page
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-y border-nokta-divider-row bg-nokta-divider-row sm:grid-cols-4">
        <MiniMetric label="Profile views" value={analytics?.profileViews ?? 0} />
        <MiniMetric label="Enquiries" value={enquiries?.totalEnquiries ?? 0} />
        <MiniMetric label="Active offers" value={commercial?.activePromotedOffers ?? 0} />
        <MiniMetric label="Featured" value={commercial?.activeFeaturedPlacements ?? 0} />
      </dl>

      <nav aria-label={`${venue.name} shortcuts`} className="flex flex-wrap gap-x-1 gap-y-1 px-3 py-2 sm:px-4">
        {links.map((link) => (
          <Link
            key={link.label}
            to={link.to}
            className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-medium text-nokta-ink-muted transition-colors hover:bg-nokta-hover hover:text-nokta-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-nokta-surface px-5 py-4 sm:px-6">
      <dt className="text-sm text-nokta-ink-muted">{label}</dt>
      <dd className="mt-1 font-brand text-2xl font-bold leading-none text-nokta-ink tabular-nums">{value.toLocaleString()}</dd>
    </div>
  );
}
