import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNoVenuesState } from "@/components/owner/OwnerNoVenuesState";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getOwnerHomeActions, getOwnerHomeGreeting, getOwnerHomeSubline, type OwnerHomeAction } from "@/lib/ownerHomeActions";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { cn } from "@/lib/utils";
import { getOwnerHomeSummary, type OwnerHomeSummary, type OwnerHomeVenue } from "@/services/ownerHomeSummaryService";
import type { BookingBandUsage } from "@/types/subscriptions";

export function OwnerDashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<OwnerHomeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getOwnerHomeSummary({ userId: user.id })
      .then((nextSummary) => {
        if (cancelled) return;
        setSummary(nextSummary);
        trackEvent("owner_dashboard_viewed", { ownedVenueCount: nextSummary.venues.length });
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
  }, [user]);

  const actions = summary ? getOwnerHomeActions(summary) : [];

  return (
    <OwnerLayout>
      <PageMeta title="Owner home | nokta" description="See what needs your attention across your claimed venues." canonicalPath="/owner" />
      {isLoading ? <LoadingState message="Loading your venues..." /> : error ? <ErrorState message={error} /> : !summary?.venues.length ? <OwnerNoVenuesState /> : (
        <div className="flex flex-col gap-5">
          <div>
            <h1 className="font-brand text-[23px] font-bold tracking-[-0.4px] text-nokta-ink">{getOwnerHomeGreeting({ hour: new Date().getHours(), venues: summary.venues, accountName: null })}</h1>
            <p className="mt-1 text-[13px] text-muted-foreground">{getOwnerHomeSubline(actions.length)}</p>
          </div>

          {actions.length ? (
            <div className="flex flex-col gap-2">
              {actions.map((action, index) => (
                <OwnerHomeActionRow key={action.id} action={action} isPrimary={index === 0} />
              ))}
            </div>
          ) : (
            <div className="rounded-[11px] border bg-card p-4 text-[13px] text-muted-foreground">Nothing needs you right now.</div>
          )}

          {summary.bookingBands.map((usage) => <OwnerBookingBandCard key={usage.venueId} usage={usage} venueName={summary.venues.find((venue) => venue.id === usage.venueId)?.name ?? "Your venue"} />)}

          <section className="rounded-xl border bg-card px-[17px] py-[15px]">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-sm font-semibold">Last 30 days</h2>
              <Link to="/owner/analytics" className="text-[12.5px] font-medium text-clay-accent hover:underline">All performance →</Link>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <OwnerHomeMetric label="Profile views" value={summary.metrics.profileViews} />
              <OwnerHomeMetric label="Directions" value={summary.metrics.directions} />
              <OwnerHomeMetric label="Enquiries" value={summary.metrics.enquiries} />
              <OwnerHomeMetric label="Saves" value={summary.metrics.saves} />
            </div>
          </section>

          <section className="rounded-xl border bg-card px-[17px] py-[15px]">
            <h2 className="text-sm font-semibold">Your venues</h2>
            <div className="mt-3">
              {summary.venues.map((venue, index) => (
                <OwnerHomeVenueRow key={venue.id} venue={venue} isLast={index === summary.venues.length - 1} />
              ))}
            </div>
          </section>
        </div>
      )}
    </OwnerLayout>
  );
}

function OwnerBookingBandCard({ usage, venueName }: { usage: BookingBandUsage; venueName: string }) {
  const band = usage.acceptedBookingsBand;
  if (!band || usage.acceptedBookings < band * 0.8) return null;
  const overBand = usage.acceptedBookings > band;
  const progress = Math.min(100, Math.round((usage.acceptedBookings / band) * 100));
  const daysLeft = Math.max(0, Math.ceil((new Date(usage.periodEnd).getTime() - Date.now()) / 86_400_000));
  const overBy = usage.acceptedBookings - band;
  return (
    <section className="rounded-[11px] border bg-card p-[15px]" aria-label={`${venueName} monthly booking band`}>
      <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">{usage.acceptedBookings}{overBand ? "" : ` of ${band}`} bookings accepted</h2>{overBand ? <span className="rounded-full bg-nokta-accent-tint px-2.5 py-1 text-xs font-semibold text-nokta-accent-dark">Past {band}</span> : <span className="text-xs text-muted-foreground">{daysLeft} days left</span>}</div>
      <div className="mt-3 h-[7px] overflow-hidden rounded-full bg-[oklch(0.93_0.02_55)]"><div className="h-full rounded-full bg-clay-accent" style={{ width: `${progress}%` }} /></div>
      {overBand ? <><p className="mt-3 text-[13px] leading-[1.6] text-nokta-ink-subtle">{numberWord(overBy)} more than your plan includes, and every one of them went through. Nothing to pay — your band is a fair-use line, not a meter. If this is your normal month, let us know and we will sort the right plan out with you.</p><div className="mt-3 flex flex-wrap gap-2"><a href="mailto:hello@nokta.uk?subject=Booking%20band" className="inline-flex h-9 items-center rounded-lg bg-clay-accent px-3 text-[12.5px] font-medium text-white hover:bg-clay-accent-hover">Talk to us about it</a><Link to="/owner/billing" className="inline-flex h-9 items-center rounded-lg border bg-card px-3 text-[12.5px] font-medium hover:bg-muted">See what Pro adds</Link></div></> : <p className="mt-3 text-[13px] leading-[1.6] text-muted-foreground">Busiest month yet. Nothing changes if you go over — we'll show you what Pro would cost when you do.</p>}
    </section>
  );
}

function numberWord(value: number) {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
  return words[value] ?? value.toLocaleString();
}

function OwnerHomeActionRow({ action, isPrimary }: { action: OwnerHomeAction; isPrimary: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-[14px] rounded-[11px] border bg-card px-[15px] py-[13px]",
        action.tone === "urgent" ? "border-[oklch(0.88_0.06_25)]" : "border-[oklch(0.87_0.08_75)]",
      )}
    >
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-nokta-ink">{action.title}</div>
        <div className="mt-0.5 text-[12.5px] text-muted-foreground">{action.description}</div>
      </div>
      <Link
        to={action.to}
        className={cn(
          "flex h-8 flex-none items-center rounded-lg px-[13px] text-[12.5px] font-medium transition-colors",
          isPrimary ? "bg-clay-accent text-white hover:bg-clay-accent/90" : "border bg-card text-nokta-ink hover:bg-muted",
        )}
      >
        {action.actionLabel}
      </Link>
    </div>
  );
}

function OwnerHomeMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[11.5px] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xl font-semibold text-nokta-ink">{value.toLocaleString()}</div>
    </div>
  );
}

function OwnerHomeVenueRow({ venue, isLast }: { venue: OwnerHomeVenue; isLast: boolean }) {
  return (
    <div className={cn("flex items-center justify-between gap-3 py-[9px]", isLast ? "" : "border-b")}>
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-medium text-nokta-ink">{venue.name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {venue.area} · {PLAN_CONFIG[venue.plan].name} ·{" "}
          {venue.liveMenuItemCount ? "profile complete" : <span className="font-medium text-[oklch(0.45_0.12_60)]">no menu or prices</span>}
        </div>
      </div>
      <Link to={`/owner/venues/${venue.slug}/profile`} className="flex-none text-[12.5px] font-medium text-clay-accent hover:underline">Manage →</Link>
    </div>
  );
}
