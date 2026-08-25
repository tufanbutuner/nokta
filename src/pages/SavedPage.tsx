import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { SavedEmptyState } from "@/components/saved/SavedEmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenues } from "@/hooks/useVenues";
import { Link } from "react-router-dom";
import type { Venue } from "@/types/venue";

export function SavedPage() {
  const { venues, isLoading, error } = useVenues();
  const { user } = useAuth();
  const { favouriteVenueIds, isLoading: preferencesLoading, error: preferencesError } = useVenuePreferences();
  const savedVenues = favouriteVenueIds
    .map((id) => venues.find((venue) => venue.id === id))
    .filter((venue): venue is Venue => Boolean(venue));

  return (
    <main>
      <PageMeta
        title="Saved Venues | Sheesha"
        description="View your saved Sheesha venues and keep a shortlist of shisha lounges to try in London."
        canonicalPath="/saved"
      />
      <PageContainer className="py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-semibold">Saved venues</h1>
          <p className="mt-2 text-muted-foreground">Your shortlist of sheesha spots to come back to.</p>
        </div>
        {!user && savedVenues.length ? (
          <div className="mb-6 flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">Sign in to sync your saved venues across devices.</p>
            <Button asChild variant="outline" size="sm">
              <Link reloadDocument to="/sign-in">
                Sign in
              </Link>
            </Button>
          </div>
        ) : null}

        {isLoading || preferencesLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : preferencesError ? (
          <ErrorState message={preferencesError} />
        ) : savedVenues.length ? (
          <VenueGrid venues={savedVenues} />
        ) : (
          <SavedEmptyState showSignInCta={!user} />
        )}
      </PageContainer>
    </main>
  );
}
