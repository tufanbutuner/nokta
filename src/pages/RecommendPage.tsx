import { useState } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { RecommendationQuiz } from "@/components/recommendations/RecommendationQuiz";
import { RecommendationResults } from "@/components/recommendations/RecommendationResults";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useAppLocation } from "@/context/AppLocationContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent } from "@/lib/analytics";
import { getRecommendedVenues } from "@/lib/recommendations";
import type { RecommendationPreferences, RecommendedVenue } from "@/types/recommendations";

export function RecommendPage() {
  const { venues, isLoading, error } = useVenues();
  const { favouriteVenueIds } = useVenuePreferences();
  const { userLocation, savedLocation } = useAppLocation();
  const [results, setResults] = useState<RecommendedVenue[] | null>(null);

  function submitPreferences(preferences: RecommendationPreferences) {
    const nextResults = getRecommendedVenues(venues, preferences, {
      userLocation,
      favouriteVenueIds,
    });
    const analyticsProperties = getRecommendationAnalyticsProperties(preferences);

    trackEvent("recommendation_started", analyticsProperties);
    trackEvent("recommendation_completed", {
      ...analyticsProperties,
      resultCount: nextResults.filter((result) => result.score > 0).length,
    });
    setResults(nextResults);
  }

  return (
    <main>
      <PageMeta
        title="Find your perfect shisha spot | Sheesha"
        description="Answer a few quick questions and get matched with shisha lounges in your selected city."
        canonicalPath="/recommend"
      />
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

function getRecommendationAnalyticsProperties(preferences: RecommendationPreferences) {
  return {
    selectedVibes: preferences.vibes.join(",") || null,
    city: preferences.city,
    priceLevel: preferences.priceLevel === "any" ? null : preferences.priceLevel,
    occasion: preferences.occasion,
  };
}
