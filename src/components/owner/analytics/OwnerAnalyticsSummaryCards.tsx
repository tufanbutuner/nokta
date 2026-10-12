import type { OwnerVenueAnalyticsSummary } from "@/services/ownerVenueAnalyticsService";

const cards = [
  { key: "profileViews", label: "Profile views", helper: "People who viewed your public venue profile." },
  { key: "bookingRequests", label: "Booking requests", helper: "Customers who submitted a booking request." },
  { key: "enquiries", label: "Enquiries", helper: "Customers who sent a venue enquiry." },
  { key: "customerActions", label: "Customer actions", helper: "Directions, website, Instagram and save actions." },
] as const;

export function OwnerAnalyticsSummaryCards({ summary }: { summary: OwnerVenueAnalyticsSummary }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.key} className="rounded-2xl border bg-nokta-surface p-5 border-nokta-border">
          <p className="text-sm text-nokta-ink-muted">{card.label}</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold">{summary[card.key]}</p>
            <Comparison current={summary[card.key]} previous={summary.previous?.[card.key]} />
          </div>
          <p className="mt-3 text-sm leading-6 text-nokta-ink-muted">{card.helper}</p>
        </article>
      ))}
    </div>
  );
}

function Comparison({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return <span className="text-xs text-nokta-ink-muted">No comparison</span>;
  if (previous === 0 && current === 0) return <span className="text-xs text-nokta-ink-muted">No change</span>;
  if (previous === 0) return <span className="text-xs font-semibold text-nokta-ok-ink">New activity</span>;

  const change = Math.round(((current - previous) / previous) * 100);
  const tone = change >= 0 ? "text-nokta-ok-ink" : "text-nokta-bad-ink";
  return <span className={`text-xs font-semibold ${tone}`}>{change >= 0 ? "+" : ""}{change}%</span>;
}
