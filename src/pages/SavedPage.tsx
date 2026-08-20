import { PageContainer } from "@/components/layout/PageContainer";
import { SavedEmptyState } from "@/components/saved/SavedEmptyState";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { venues } from "@/data/venues";

export function SavedPage() {
  const { favouriteVenueIds } = useVenuePreferences();
  const savedVenues = favouriteVenueIds
    .map((id) => venues.find((venue) => venue.id === id))
    .filter((venue): venue is (typeof venues)[number] => Boolean(venue));

  return (
    <main>
      <PageContainer className="py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold">Saved venues</h1>
          <p className="mt-2 text-muted-foreground">Your shortlist of shisha spots to come back to.</p>
        </div>
        {savedVenues.length ? <VenueGrid venues={savedVenues} /> : <SavedEmptyState />}
      </PageContainer>
    </main>
  );
}
