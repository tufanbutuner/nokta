import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, BookOpenCheck, CalendarCog, CreditCard, Inbox, Megaphone } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNoVenuesState } from "@/components/owner/OwnerNoVenuesState";
import { OwnerVenueCard } from "@/components/owner/OwnerVenueCard";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getMyClaimedVenues } from "@/services/ownerVenueService";
import { getOwnerVenueAnalyticsSummary, type OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";
import { getOwnerVenueCommercialSummary, type OwnerVenueCommercialSummary } from "@/services/ownerCommercialSummaryService";
import { getOwnerVenueEnquirySummary, type OwnerVenueEnquirySummary } from "@/services/ownerVenueEnquirySummaryService";
import { getOwnerVenueSubscriptions } from "@/services/ownerSubscriptionService";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, OwnerVenueAnalyticsSummary>>({});
  const [enquiries, setEnquiries] = useState<Record<string, OwnerVenueEnquirySummary>>({});
  const [commercial, setCommercial] = useState<Record<string, OwnerVenueCommercialSummary>>({});
  const [subscriptions, setSubscriptions] = useState<Record<string, VenueSubscription>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const range = useMemo(last30Days, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getMyClaimedVenues(user.id)
      .then(async (nextVenues) => {
        if (cancelled) return;
        setVenues(nextVenues);
        trackEvent("owner_dashboard_viewed", { ownedVenueCount: nextVenues.length });
        const [nextSubscriptions, results] = await Promise.all([
          getOwnerVenueSubscriptions(user.id).catch(() => []),
          Promise.all(nextVenues.map(async (venue) => {
          const [venueAnalytics, venueEnquiries, venueCommercial] = await Promise.all([
            getOwnerVenueAnalyticsSummary({ userId: user.id, venueId: venue.id, from: range.from, to: range.to }).catch(() => null),
            getOwnerVenueEnquirySummary({ userId: user.id, venueId: venue.id }).catch(() => null),
            getOwnerVenueCommercialSummary({ userId: user.id, venueId: venue.id }).catch(() => null),
          ]);
          return { venue, venueAnalytics, venueEnquiries, venueCommercial };
          })),
        ]);
        if (cancelled) return;
        setAnalytics(Object.fromEntries(results.flatMap((item) => item.venueAnalytics ? [[item.venue.id, item.venueAnalytics]] : [])));
        setEnquiries(Object.fromEntries(results.flatMap((item) => item.venueEnquiries ? [[item.venue.id, item.venueEnquiries]] : [])));
        setCommercial(Object.fromEntries(results.flatMap((item) => item.venueCommercial ? [[item.venue.id, item.venueCommercial]] : [])));
        setSubscriptions(Object.fromEntries(nextSubscriptions.map((subscription) => [subscription.venueId, subscription])));
      })
      .catch((caughtError) => {
        if (!cancelled) setError(caughtError instanceof Error ? caughtError.message : "Could not load owner dashboard.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [range.from, range.to, user]);

  const primaryVenue = venues[0];
  const sectionCards = primaryVenue ? [
    {
      title: "Analytics",
      description: "See views, customer actions, booking demand and value reporting.",
      to: "/owner/analytics",
      Icon: BarChart3,
    },
    {
      title: "Bookings",
      description: "Review requests, accept bookings and manage your calendar.",
      to: "/owner/bookings?view=week",
      Icon: BookOpenCheck,
    },
    {
      title: "Availability",
      description: "Set bookable days, time windows and blackout dates.",
      to: `/owner/venues/${primaryVenue.slug}/availability`,
      Icon: CalendarCog,
    },
    {
      title: "Enquiries",
      description: "Manage customer enquiries from one owner inbox.",
      to: "/owner/enquiries",
      Icon: Inbox,
    },
    {
      title: "Promotions",
      description: "Request promoted offers and featured placements.",
      to: "/owner/promotions",
      Icon: Megaphone,
    },
    {
      title: "Billing",
      description: "View your current plan and manage subscription settings.",
      to: "/owner/billing",
      Icon: CreditCard,
    },
  ] : [];

  return (
    <OwnerLayout>
      <PageMeta title="Owner dashboard | nokta" description="View your claimed venues, profile performance and enquiry activity." canonicalPath="/owner" />
      <div className="space-y-6">
        <div>
          <p className="text-sm text-clay-accent">Owner dashboard</p>
          <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Owner dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">View your claimed venues, profile performance and enquiry activity.</p>
        </div>
        {isLoading ? <LoadingState message="Loading owner dashboard..." /> : error ? <ErrorState message={error} /> : !venues.length ? <OwnerNoVenuesState /> : (
          <>
            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Manage your venue</h2>
                <p className="mt-1 text-sm text-muted-foreground">Jump into the owner tools you use most.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sectionCards.map((card) => (
                  <OwnerSectionCard key={card.title} {...card} />
                ))}
              </div>
            </section>
            <div className="grid gap-4">
              {venues.map((venue) => <OwnerVenueCard key={venue.id} venue={venue} analytics={analytics[venue.id]} enquiries={enquiries[venue.id]} commercial={commercial[venue.id]} subscription={subscriptions[venue.id]} />)}
            </div>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}

function OwnerSectionCard({
  title,
  description,
  to,
  Icon,
}: {
  title: string;
  description: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link to={to} className="group rounded-xl border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-950/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clay-accent/10 text-clay-accent">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-semibold text-clay-accent transition group-hover:translate-x-0.5">Open</span>
      </div>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}

function last30Days() {
  return { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() };
}
