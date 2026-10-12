import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ChevronRight, CircleCheck, ImagePlus, Inbox, ReceiptText } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { OwnerNoVenuesState } from "@/components/owner/OwnerNoVenuesState";
import { WorkspacePageHeader, workspacePrimaryActionClass, workspaceSecondaryActionClass } from "@/components/workspace/WorkspacePageHeader";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { getOwnerHomeActions, getOwnerHomeGreeting, getOwnerHomeSubline, type OwnerHomeAction } from "@/lib/ownerHomeActions";
import { PLAN_CONFIG } from "@/lib/planConfig";
import { cn } from "@/lib/utils";
import { getOwnerHomeSummary, type OwnerHomeSummary, type OwnerHomeVenue } from "@/services/ownerHomeSummaryService";
import type { BookingBandUsage } from "@/types/subscriptions";

type IconType = ComponentType<{ className?: string }>;

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
      <div className="mx-auto max-w-6xl">
        {isLoading ? <DashboardSkeleton /> : error ? <ErrorState title="Couldn't load your dashboard" message={error} /> : !summary?.venues.length ? <OwnerNoVenuesState /> : (
          <>
            <WorkspacePageHeader
              title={getOwnerHomeGreeting({ hour: new Date().getHours(), venues: summary.venues, accountName: null })}
              description={getOwnerHomeSubline(actions.length)}
            />

            <div className="mt-8 grid gap-10 sm:mt-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
              <div className="space-y-10">
                <Section title="Needs you">
                  {actions.length ? (
                    <ul className="divide-y divide-nokta-divider-row overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface">
                      {actions.map((action, index) => (
                        <OwnerHomeActionRow key={action.id} action={action} isPrimary={index === 0} />
                      ))}
                    </ul>
                  ) : (
                    <p role="status" className="flex items-start gap-3 rounded-2xl bg-nokta-ok-tint px-5 py-4 text-[15px] text-nokta-ink">
                      <CircleCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-nokta-ok-ink" />
                      All caught up. New booking requests and enquiries will show up here first.
                    </p>
                  )}
                </Section>

                {summary.bookingBands.map((usage) => (
                  <OwnerBookingBandCard key={usage.venueId} usage={usage} venueName={summary.venues.find((venue) => venue.id === usage.venueId)?.name ?? "Your venue"} />
                ))}

                <Section
                  title="Last 30 days"
                  action={
                    <Link to="/owner/analytics" className={textLinkClass}>
                      All performance
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  }
                >
                  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-nokta-border bg-nokta-divider-row sm:grid-cols-4">
                    <OwnerHomeMetric label="Profile views" value={summary.metrics.profileViews} />
                    <OwnerHomeMetric label="Directions" value={summary.metrics.directions} />
                    <OwnerHomeMetric label="Enquiries" value={summary.metrics.enquiries} />
                    <OwnerHomeMetric label="Saves" value={summary.metrics.saves} />
                  </dl>
                </Section>
              </div>

              <aside>
                <Section
                  title={summary.venues.length === 1 ? "Your venue" : "Your venues"}
                  action={
                    summary.venues.length > 1 ? (
                      <Link to="/owner/venues" className={textLinkClass}>
                        All
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                    ) : null
                  }
                >
                  <ul className="-mx-3">
                    {summary.venues.map((venue) => (
                      <OwnerHomeVenueRow key={venue.id} venue={venue} />
                    ))}
                  </ul>
                </Section>
              </aside>
            </div>
          </>
        )}
      </div>
    </OwnerLayout>
  );
}

const textLinkClass =
  "inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-nokta-ink underline decoration-nokta-accent/50 decoration-2 underline-offset-4 transition-colors hover:decoration-nokta-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-brand text-xl font-bold tracking-[-0.01em] text-nokta-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

const ACTION_ICONS: Array<[prefix: string, icon: IconType]> = [
  ["booking-requests", CalendarDays],
  ["new-enquiries", Inbox],
  ["no-menu", ReceiptText],
  ["stale-menu", ReceiptText],
  ["photos", ImagePlus],
];

function OwnerHomeActionRow({ action, isPrimary }: { action: OwnerHomeAction; isPrimary: boolean }) {
  const Icon = ACTION_ICONS.find(([prefix]) => action.id.startsWith(prefix))?.[1] ?? CalendarDays;
  const isUrgent = action.tone === "urgent";

  return (
    <li className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", isUrgent ? "bg-nokta-accent-solid text-white" : "bg-nokta-chip-tint text-nokta-accent-dark")}>
          <Icon className="size-[18px]" />
        </span>
        <div className="min-w-0 pt-0.5">
          <p className="text-base font-semibold text-nokta-ink">{action.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-nokta-ink-muted">{action.description}</p>
        </div>
      </div>
      <Link to={action.to} className={cn(isPrimary ? workspacePrimaryActionClass : workspaceSecondaryActionClass, "ml-14 self-start sm:ml-0 sm:self-center")}>
        {action.actionLabel}
      </Link>
    </li>
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
    <section className="rounded-2xl border border-nokta-border bg-nokta-surface p-5 sm:p-6" aria-label={`${venueName} monthly booking band`}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-brand text-xl font-bold tracking-[-0.01em] text-nokta-ink">
          <span className="tabular-nums">{usage.acceptedBookings}</span>
          {overBand ? "" : <> of <span className="tabular-nums">{band}</span></>} bookings accepted
        </h2>
        {overBand ? (
          <span className="rounded-full bg-nokta-accent-tint px-2.5 py-1 text-xs font-semibold text-nokta-accent-dark">Past {band}</span>
        ) : (
          <span className="text-sm text-nokta-ink-muted">{daysLeft} days left</span>
        )}
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-nokta-track" role="progressbar" aria-valuemin={0} aria-valuemax={band} aria-valuenow={Math.min(usage.acceptedBookings, band)} aria-label="Bookings accepted this period">
        <div className="h-full rounded-full bg-nokta-accent-solid" style={{ width: `${progress}%` }} />
      </div>
      {overBand ? (
        <>
          <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-nokta-ink-subtle">
            {numberWord(overBy)} more than your plan includes, and every one of them went through. Nothing to pay — your band is a fair-use line, not a meter. If this is your normal month, let us know and we will sort the right plan out with you.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <a href="mailto:hello@nokta.uk?subject=Booking%20band" className={workspacePrimaryActionClass}>Talk to us about it</a>
            <Link to="/owner/billing" className={workspaceSecondaryActionClass}>See what Pro adds</Link>
          </div>
        </>
      ) : (
        <p className="mt-4 max-w-prose text-[15px] leading-relaxed text-nokta-ink-muted">Busiest month yet. Nothing changes if you go over — we'll show you what Pro would cost when you do.</p>
      )}
    </section>
  );
}

function numberWord(value: number) {
  const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"];
  return words[value] ?? value.toLocaleString();
}

function OwnerHomeMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-nokta-surface px-5 py-4">
      <dt className="text-sm text-nokta-ink-muted">{label}</dt>
      <dd className="mt-1 font-brand text-[1.75rem] font-bold leading-none tracking-[-0.02em] text-nokta-ink tabular-nums">{value.toLocaleString()}</dd>
    </div>
  );
}

function OwnerHomeVenueRow({ venue }: { venue: OwnerHomeVenue }) {
  const isComplete = venue.liveMenuItemCount > 0;
  return (
    <li>
      <Link
        to={`/owner/venues/${venue.slug}/profile`}
        className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-nokta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-semibold text-nokta-ink">{venue.name}</span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-nokta-ink-muted">
            <span>{venue.area}</span>
            <span aria-hidden="true" className="opacity-45">·</span>
            <span>{PLAN_CONFIG[venue.plan].name}</span>
          </span>
          <span className={cn("mt-1.5 inline-flex items-center gap-1.5 text-sm font-medium", isComplete ? "text-nokta-ink-muted" : "text-nokta-accent-dark")}>
            <span aria-hidden="true" className={cn("size-1.5 rounded-full", isComplete ? "bg-nokta-ok-solid" : "bg-nokta-accent-solid")} />
            {isComplete ? "Menu and prices live" : "No menu or prices yet"}
          </span>
        </span>
        <ChevronRight aria-hidden="true" className="size-5 shrink-0 text-nokta-ink-muted transition-transform group-hover:translate-x-0.5" />
        <span className="sr-only">Manage {venue.name}</span>
      </Link>
    </li>
  );
}

function DashboardSkeleton() {
  return (
    <div role="status" aria-label="Loading your venues">
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-56" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div className="space-y-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-[4.75rem] rounded-2xl" />
          <Skeleton className="h-[4.75rem] rounded-2xl" />
          <Skeleton className="mt-6 h-24 rounded-2xl" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>
      <span className="sr-only">Loading your venues…</span>
    </div>
  );
}
