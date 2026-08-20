import { PageContainer } from "@/components/layout/PageContainer";
import { SavedEmptyState } from "@/components/saved/SavedEmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenues } from "@/hooks/useVenues";
import type { Venue } from "@/types/venue";

export function SavedPage() {
  const { venues, isLoading, error } = useVenues();
  const { favouriteVenueIds } = useVenuePreferences();
  const savedVenues = favouriteVenueIds
    .map((id) => venues.find((venue) => venue.id === id))
    .filter((venue): venue is Venue => Boolean(venue));

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold">Saved venues</h1>
          <p className="mt-2 text-muted-foreground">Your shortlist of sheesha spots to come back to.</p>
        </div>
        {isLoading ? <LoadingState /> : error ? <ErrorState message={error} /> : savedVenues.length ? <VenueGrid venues={savedVenues} /> : <SavedEmptyState />}
      </PageContainer>
    </main>
  );
}
