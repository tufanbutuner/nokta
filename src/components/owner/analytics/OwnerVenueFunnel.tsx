import type { OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";

export function OwnerVenueFunnel({ summary }: { summary: OwnerVenueAnalyticsSummary }) {
  if (!summary.profileViews) {
    return (
      <section className="rounded-2xl border bg-nokta-surface p-5 border-nokta-border">
        <h2 className="font-semibold">Booking funnel</h2>
        <p className="mt-3 text-sm leading-6 text-nokta-ink-muted">
          Not enough data yet. Once more customers view your venue, Nokta will show how profile views turn into booking requests.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-nokta-surface p-5 border-nokta-border">
      <h2 className="font-semibold">Booking funnel</h2>
      <div className="mt-5 grid gap-3">
        <FunnelRow label="Profile views" value={summary.profileViews} helper="Starting point" />
        <FunnelRow label="Booking CTA clicks" value={summary.bookingCtaClicks} helper={`${formatRate(summary.bookingCtaRate)} of profile views`} />
        <FunnelRow label="Booking requests" value={summary.bookingRequests} helper={`${formatRate(summary.bookingSubmitRate)} of booking clicks`} />
      </div>
      <p className="mt-4 rounded-lg bg-nokta-track/40 p-3 text-sm text-nokta-ink-muted">
        Overall booking conversion: <span className="font-semibold text-nokta-ink">{formatRate(summary.conversionRate)}</span>
      </p>
    </section>
  );
}

function FunnelRow({ label, value, helper }: { label: string; value: number; helper: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border bg-nokta-surface-alt/60 p-3 border-nokta-border">
      <div>
        <p className="font-medium">{label}</p>
        <p className="mt-1 text-xs text-nokta-ink-muted">{helper}</p>
      </div>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}

function formatRate(value: number | null) {
  return value === null ? "0%" : `${value}%`;
}
