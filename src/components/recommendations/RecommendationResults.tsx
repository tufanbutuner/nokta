import { RecommendationEmptyState } from "@/components/recommendations/RecommendationEmptyState";
import { RecommendationResultCard } from "@/components/recommendations/RecommendationResultCard";
import { Button } from "@/components/ui/button";
import type { RecommendedVenue } from "@/types/recommendations";

export function RecommendationResults({ results, onRestart }: { results: RecommendedVenue[]; onRestart: () => void }) {
  const visibleResults = results.filter((result) => result.score > 0).slice(0, 6);

  if (visibleResults.length === 0) {
    return <RecommendationEmptyState onRestart={onRestart} />;
  }

  return (
    <section>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Top recommendations</p>
          <h2 className="text-4xl font-semibold">Your best matches</h2>
        </div>
        <Button variant="outline" onClick={onRestart}>
          Edit preferences
        </Button>
      </div>
      <div className="space-y-5">
        {visibleResults.map((recommendation, index) => (
          <RecommendationResultCard key={recommendation.venue.id} recommendation={recommendation} rank={index + 1} />
        ))}
      </div>
    </section>
  );
}
