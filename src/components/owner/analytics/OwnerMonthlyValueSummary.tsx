import type { OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";

export function OwnerMonthlyValueSummary({ summary, isPro }: { summary: OwnerVenueAnalyticsSummary; isPro: boolean }) {
  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Monthly value summary</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">In the last 30 days, Nokta helped your venue receive:</p>
      <ul className="mt-4 grid gap-2 text-sm">
        <li>{summary.profileViews} profile views</li>
        <li>{summary.customerActions} customer actions</li>
        <li>{summary.bookingRequests} booking requests</li>
        <li>{summary.enquiries} enquiries</li>
      </ul>
      {isPro ? <p className="mt-4 text-sm text-muted-foreground">Pro reporting can include featured placement, promoted offer and conversion trends.</p> : null}
    </section>
  );
}
