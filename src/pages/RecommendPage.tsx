import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { RecommendationQuiz } from "@/components/recommendations/RecommendationQuiz";
import { RecommendationResults } from "@/components/recommendations/RecommendationResults";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useAppLocation } from "@/context/AppLocationContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenues } from "@/hooks/useVenues";
import { getRecommendedVenues } from "@/lib/recommendations";
import type { RecommendationPreferences, RecommendedVenue } from "@/types/recommendations";

export function RecommendPage() {
  const { venues, isLoading, error } = useVenues();
  const { favouriteVenueIds } = useVenuePreferences();
  const { userLocation, savedLocation } = useAppLocation();
  const [results, setResults] = useState<RecommendedVenue[] | null>(null);

  function submitPreferences(preferences: RecommendationPreferences) {
    setResults(
      getRecommendedVenues(venues, preferences, {
        userLocation,
        favouriteVenueIds,
      }),
    );
  }

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mb-8">
          <div>
            <p className="text-sm text-muted-foreground">Recommendations</p>
            <h1 className="mt-2 text-5xl font-semibold">Find my spot</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              A quick preference flow for choosing where to go, powered by venue data rather than guesswork.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              {savedLocation ? `Using ${savedLocation.label} as your location context.` : "Set your location in the navbar to include distance in recommendations."}
            </p>
          </div>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : results ? (
          <RecommendationResults results={results} onRestart={() => setResults(null)} />
        ) : (
          <RecommendationQuiz locationAvailable={Boolean(userLocation)} onSubmit={submitPreferences} />
        )}
      </PageContainer>
    </main>
  );
}
