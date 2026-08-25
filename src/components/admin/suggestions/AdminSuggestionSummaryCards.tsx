import { Card, CardContent } from "@/components/ui/card";
import type { VenueSuggestion, VenueSuggestionStatus } from "@/types/venueSuggestions";

const STATUS_ORDER: VenueSuggestionStatus[] = ["pending", "approved", "rejected", "converted"];

export function AdminSuggestionSummaryCards({ suggestions }: { suggestions: VenueSuggestion[] }) {
  const counts = suggestions.reduce<Record<VenueSuggestionStatus, number>>(
    (nextCounts, suggestion) => ({
      ...nextCounts,
      [suggestion.status]: nextCounts[suggestion.status] + 1,
    }),
    { pending: 0, approved: 0, rejected: 0, converted: 0 },
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <MetricCard label="Total suggestions" value={suggestions.length} />
      {STATUS_ORDER.map((status) => (
        <MetricCard key={status} label={`${status[0].toUpperCase()}${status.slice(1)}`} value={counts[status]} />
      ))}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
