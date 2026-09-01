import type { OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";

export function OwnerValueInsightsPanel({ summary }: { summary: OwnerVenueAnalyticsSummary }) {
  const insights = getInsights(summary);

  return (
    <section className="rounded-xl border bg-card p-5">
      <h2 className="font-semibold">Value insights</h2>
      <p className="mt-1 text-sm text-muted-foreground">Simple signals from customer activity on Nokta.</p>
      <div className="mt-5 grid gap-3">
        {insights.map((insight) => (
          <div key={insight} className="rounded-lg border bg-background/60 p-3 text-sm leading-6">
            {insight}
          </div>
        ))}
      </div>
    </section>
  );
}

function getInsights(summary: OwnerVenueAnalyticsSummary) {
  const insights = [
    `Your venue profile received ${summary.profileViews} views in this period.`,
    `${summary.customerActions} people took a customer action such as directions, website, Instagram or save.`,
    `${summary.bookingCtaClicks} people clicked to request a booking, and ${summary.bookingRequests} booking requests were submitted.`,
  ];

  if (summary.profileViews >= 20 && summary.bookingRequests === 0) {
    insights.push("Profile views are coming through, but booking requests are low. Improving photos, opening hours and booking instructions may help conversion.");
  } else if (summary.bookingCtaClicks > summary.bookingRequests) {
    insights.push("Some customers start the booking journey without submitting. Check your availability settings and booking form guidance.");
  } else if (summary.directionsClicks > 0) {
    insights.push("Directions clicks suggest customers may be planning a visit soon. Keep opening hours and contact details up to date.");
  } else if (summary.profileViews < 10) {
    insights.push("Profile views are still low. Completing your profile or requesting a featured placement may help improve visibility.");
  }

  return insights;
}
