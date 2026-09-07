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
