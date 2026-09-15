import { Link, useParams } from "react-router-dom";
import { CityFeaturedVenues } from "@/components/featured/CityFeaturedVenues";
import { PageContainer } from "@/components/layout/PageContainer";
import { CityOffersSection } from "@/components/offers/CityOffersSection";
import { PageMeta } from "@/components/seo/PageMeta";
import { EmptyState } from "@/components/state/EmptyState";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { useVenues } from "@/hooks/useVenues";
import { getCityBySlug } from "@/lib/cities";
import { getCityPageMetadata, getInactiveCityPageMetadata } from "@/lib/pageMetadata";

export function CityPage() {
  const { citySlug = "" } = useParams();
  const city = getCityBySlug(citySlug);
  const { venues, isLoading, error } = useVenues();
  const cityVenues = city ? venues.filter((venue) => venue.country === city.country && venue.city === city.name) : [];

  if (!city) {
    return (
      <main>
        <PageMeta title="City not found | nokta" description="This nokta city page is not available." />
        <PageContainer className="py-16">
          <EmptyState title="City not found" description="This city is not available in nokta yet." />
        </PageContainer>
      </main>
    );
  }

  if (!city.isActive) {
    return (
      <main>
        <PageMeta {...getInactiveCityPageMetadata(city.name)} canonicalPath={`/cities/${city.slug}`} />
        <PageContainer className="py-16">
          <EmptyState
            title={`${city.name} coming soon`}
            description={`We are adding verified social venues in ${city.name} soon.`}
          >
            <Button asChild className="mt-6">
              <Link to="/suggest">
                Suggest a venue
              </Link>
            </Button>
          </EmptyState>
        </PageContainer>
      </main>
    );
  }

  return (
    <main>
      <PageMeta {...getCityPageMetadata(city.name)} canonicalPath={`/cities/${city.slug}`} />
      <PageContainer className="py-12">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm text-clay-accent">{city.country}</p>
            <h1 className="mt-2 text-5xl font-semibold">Venues in {city.name}</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Explore social venues in {city.name}, starting with shisha lounges and lounge venues. Venue details are checked where possible, but always confirm directly before travelling or booking.
            </p>
          </div>
          <Button asChild>
            <Link to={`/discover?city=${encodeURIComponent(city.name)}`}>
              Open Discover
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : cityVenues.length ? (
          <>
            <CityFeaturedVenues city={city.name} venues={cityVenues} />
            <CityOffersSection city={city.name} venues={cityVenues} />
            <p className="mb-4 text-sm text-muted-foreground">
              {cityVenues.length === 1 ? "1 venue" : `${cityVenues.length} venues`} in {city.name}
            </p>
            <VenueGrid venues={cityVenues} />
          </>
        ) : (
          <EmptyState title={`No ${city.name} venues yet`} description="Verified venues will appear here once the city catalogue is ready." />
        )}
      </PageContainer>
    </main>
  );
}
