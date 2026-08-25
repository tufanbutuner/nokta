import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VenueSuggestion, VenueSuggestionStatus } from "@/types/venueSuggestions";

const STATUS_LABELS: Record<VenueSuggestionStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Not accepted",
  converted: "Added to Sheesha",
};

const STATUS_CLASSES: Record<VenueSuggestionStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  converted: "border-stone-200 bg-stone-100 text-stone-700",
};

export function MySuggestionsList({ suggestions }: { suggestions: VenueSuggestion[] }) {
  if (!suggestions.length) {
    return (
      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold">No suggestions yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">Your submitted venues will appear here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((suggestion) => (
        <Card key={suggestion.id}>
          <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold">{suggestion.venueName}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {[suggestion.area, suggestion.postcode].filter(Boolean).join(" • ") || "Location TBC"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Submitted {formatDate(suggestion.createdAt)}</p>
            </div>
            <Badge variant="outline" className={cn("w-fit", STATUS_CLASSES[suggestion.status])}>
              {STATUS_LABELS[suggestion.status]}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
