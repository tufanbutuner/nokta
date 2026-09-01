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
        <article key={card.key} className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="text-sm text-muted-foreground">{card.label}</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold">{summary[card.key]}</p>
            <Comparison current={summary[card.key]} previous={summary.previous?.[card.key]} />
          </div>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">{card.helper}</p>
        </article>
      ))}
    </div>
  );
}

function Comparison({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return <span className="text-xs text-muted-foreground">No comparison</span>;
  if (previous === 0 && current === 0) return <span className="text-xs text-muted-foreground">No change</span>;
  if (previous === 0) return <span className="text-xs font-semibold text-emerald-700">New activity</span>;

  const change = Math.round(((current - previous) / previous) * 100);
  const tone = change >= 0 ? "text-emerald-700" : "text-rose-700";
  return <span className={`text-xs font-semibold ${tone}`}>{change >= 0 ? "+" : ""}{change}%</span>;
}
