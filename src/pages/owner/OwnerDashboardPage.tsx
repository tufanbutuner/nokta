import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowRight, BarChart3, BookOpenCheck, CalendarCog, CreditCard, Inbox, Megaphone } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNoVenuesState } from "@/components/owner/OwnerNoVenuesState";
import { OwnerVenueCard } from "@/components/owner/OwnerVenueCard";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
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
  const totalNewEnquiries = Object.values(enquiries).reduce((total, summary) => total + summary.newEnquiries, 0);
  const totalBookingDemand = Object.values(analytics).reduce((total, summary) => total + summary.bookingRequests, 0);
  const venuesWithoutPromotions = venues.filter((venue) => {
    const venueCommercial = commercial[venue.id];
    return venueCommercial ? !venueCommercial.hasActiveFeaturedPlacement && !venueCommercial.hasActivePromotedOffer : false;
  }).length;
  const profileUpdateCount = venues.filter((venue) => subscriptionHasProfileUpdates(subscriptions[venue.id])).length;
  const attentionItems = [
    {
      label: "New enquiries",
      value: totalNewEnquiries,
      description: totalNewEnquiries ? "Customers are waiting for a reply." : "Inbox is clear.",
      to: "/owner/enquiries",
      Icon: Inbox,
      tone: totalNewEnquiries ? "urgent" : "neutral",
    },
    {
      label: "Booking demand",
      value: totalBookingDemand,
      description: totalBookingDemand ? "Requests received in the last 30 days." : "No booking requests in this period.",
      to: "/owner/bookings?view=week",
      Icon: BookOpenCheck,
      tone: totalBookingDemand ? "active" : "neutral",
    },
    {
      label: "Visibility gaps",
      value: venuesWithoutPromotions,
      description: venuesWithoutPromotions ? "Venues without active promotions." : "Promotion coverage looks healthy.",
      to: "/owner/promotions",
      Icon: Megaphone,
      tone: venuesWithoutPromotions ? "active" : "neutral",
    },
  ] as const;
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
      to: venues.length === 1 ? `/owner/venues/${primaryVenue.slug}/availability` : "/owner/venues",
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
      <div className="space-y-7">
        <div>
          <p className="text-sm font-semibold text-clay-accent">Owner workspace</p>
          <h1 className="mt-1 font-brand text-4xl font-bold tracking-[-0.5px]">Today at a glance</h1>
          <p className="mt-2 text-sm text-muted-foreground">Start with what needs attention, then jump into the right tool.</p>
        </div>
        {isLoading ? <LoadingState message="Loading owner dashboard..." /> : error ? <ErrorState message={error} /> : !venues.length ? <OwnerNoVenuesState /> : (
          <>
            <section>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Needs attention</h2>
                  <p className="mt-1 text-sm text-muted-foreground">A quick read on customer activity and profile opportunities.</p>
                </div>
                <p className="text-sm text-muted-foreground">{venues.length} owned venue{venues.length === 1 ? "" : "s"} · {profileUpdateCount} update-ready</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {attentionItems.map((item) => (
                  <OwnerAttentionCard key={item.label} {...item} />
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Owner tools</h2>
                <p className="mt-1 text-sm text-muted-foreground">Manage bookings, profile quality, visibility and billing.</p>
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
    <Link to={to} className="group rounded-2xl border border-nokta-border bg-white p-5 shadow-sm shadow-stone-950/5 transition hover:-translate-y-0.5 hover:border-nokta-ink/20 hover:shadow-lg hover:shadow-stone-950/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-nokta-ink/5 text-nokta-ink">
          <Icon className="h-5 w-5" />
        </div>
        <ArrowRight className="h-4 w-4 text-nokta-ink-muted transition group-hover:translate-x-0.5 group-hover:text-nokta-ink" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-nokta-ink">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}

function OwnerAttentionCard({
  label,
  value,
  description,
  to,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  to: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone: "urgent" | "active" | "neutral";
}) {
  return (
    <Link
      to={to}
      className={cn(
        "group rounded-2xl border bg-white p-5 shadow-sm shadow-stone-950/5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-950/5",
        tone === "urgent" ? "border-rose-200" : "border-nokta-border",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", tone === "urgent" ? "bg-rose-50 text-rose-700" : tone === "active" ? "bg-clay-100 text-clay-700" : "bg-nokta-ink/5 text-nokta-ink-muted")}>
          {tone === "urgent" ? <AlertCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
        </div>
        <ArrowRight className="h-4 w-4 text-nokta-ink-muted transition group-hover:translate-x-0.5 group-hover:text-nokta-ink" />
      </div>
      <p className="mt-5 text-sm font-medium text-nokta-ink-muted">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-nokta-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </Link>
  );
}

function subscriptionHasProfileUpdates(subscription?: VenueSubscription) {
  return Boolean(subscription?.plan && subscription.plan !== "free");
}

function last30Days() {
  return { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), to: new Date().toISOString() };
}
