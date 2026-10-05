import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronRight, Search, Star } from "lucide-react";
import { HomepageFeaturedVenues } from "@/components/featured/HomepageFeaturedVenues";
import { PageContainer } from "@/components/layout/PageContainer";
import { HomepageOffersSection } from "@/components/offers/HomepageOffersSection";
import { CitySelector } from "@/components/search/CitySelector";
import { PageMeta } from "@/components/seo/PageMeta";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/state/ErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { useVenues } from "@/hooks/useVenues";
import { brandConfig } from "@/config/brand";
import { DEFAULT_CITY, getActiveCities } from "@/lib/cities";
import { VenueImage } from "@/components/venues/VenueImage";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import type { Venue } from "@/types/venue";

const quickFilters: Array<{ label: string; params: Record<string, string> }> = [
  { label: "Open now", params: { status: "open" } },
  { label: "Good for groups", params: { vibes: "groups" } },
  { label: "Outdoor seating", params: { features: "outdoor" } },
  { label: "£ Budget", params: { price: "1" } },
  { label: "Top rated", params: { rating: "4" } },
];

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY);
  const { venues, isLoading, error } = useVenues();
  const featured = venues.slice(0, 4);
  const areaCards = useMemo(() => getAreaCards(venues, DEFAULT_CITY), [venues]);
  const cityCards = useMemo(() => getCityCards(venues), [venues]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ city: selectedCity });

    if (query.trim()) {
      params.set("q", query.trim());
    }

    navigate(`/discover?${params.toString()}`);
  }

  return (
    <main>
      <PageMeta
        title={`${brandConfig.appName} - Discover Social Venues Across the UK`}
        description="Find lounges, restaurants, bars and cafes across the UK, starting with shisha lounges. View venue details, photos, opening info and request bookings."
        canonicalPath="/"
      />
      <section>
        <PageContainer className="py-12 sm:py-16 lg:py-20">
          <div className="relative isolate mx-auto max-w-5xl px-4 py-12 text-center sm:px-8 sm:py-16 lg:py-20">
            <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay-accent opacity-[0.08] sm:h-[30rem] sm:w-[30rem] lg:h-[34rem] lg:w-[34rem]" />
            <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
              Find the right spot
              <span className="mt-1 block text-clay-accent">before you head out</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Search shisha lounges across the UK, compare the details, then book with more confidence.
            </p>

            <form className="mx-auto mt-8 max-w-3xl rounded-2xl border bg-card p-2 shadow-xl shadow-stone-950/5" onSubmit={handleSearchSubmit}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:grid-cols-[minmax(0,1fr)_11rem_auto] sm:gap-0">
                <div className="relative col-span-2 sm:col-span-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-w-0 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                    placeholder="Search venues, areas or vibes..."
                    aria-label="Search venues, areas or vibes"
                  />
                </div>
                <CitySelector
                  id="homepage-city"
                  value={selectedCity}
                  onChange={setSelectedCity}
                  className="h-10 rounded-lg border-nokta-border-input bg-white focus:ring-0 focus:ring-offset-0 focus-visible:bg-nokta-accent-tint/40 sm:rounded-none sm:border-y-0 sm:border-r-0"
                />
                <Button type="submit" className="h-10 gap-2 bg-clay-accent px-4 text-white hover:bg-clay-accent-hover sm:ml-2 sm:w-24">
                  <Search className="h-4 w-4" />
                  <span>Explore</span>
                </Button>
              </div>
            </form>

            <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
              {quickFilters.map((filter) => (
                <Link key={filter.label} to={buildDiscoverPath(selectedCity, filter.params)}>
                  <Badge variant="outline" className="border-transparent bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/75 hover:bg-foreground/10">
                    {filter.label}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

        </PageContainer>
      </section>

      <PageContainer className="space-y-14 py-10 sm:space-y-16 sm:py-14">
        {isLoading ? <HomepagePromoSectionSkeleton title="Featured venues" /> : !error ? <HomepageFeaturedVenues venues={venues} /> : null}
        {isLoading ? <HomepagePromoSectionSkeleton title="Latest venue offers" /> : !error ? <HomepageOffersSection venues={venues} /> : null}

        <section>
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-clay-accent">Explore venues</p>
              <h2 className="mt-1 text-3xl font-semibold">Book-worthy venues</h2>
            </div>
            <Button asChild variant="outline" className="w-fit">
              <Link to="/discover">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {isLoading ? <LandingVenueGridSkeleton /> : error ? <ErrorState message={error} /> : <LandingVenueGrid venues={featured} />}
        </section>

        <section>
          <div className="mb-6">
            <h2 className="text-3xl font-semibold">Browse by place</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Start with a city, or jump straight into the London areas people already search for.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {cityCards.map((city) => (
              <Link
                key={city.slug}
                to={`/cities/${city.slug}`}
                className="group relative isolate overflow-hidden rounded-xl border bg-card p-4 transition hover:-translate-y-0.5 hover:border-nokta-border-input"
              >
                <CardMark className="-bottom-12 -right-10 h-32 w-32 opacity-[0.04]" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{city.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{city.count === 1 ? "1 venue listed" : `${city.count} venues listed`}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                </div>
              </Link>
            ))}
          </div>

          <div className="mb-3 mt-8 flex items-center justify-between gap-4">
            <h3 className="text-lg font-semibold">Popular London areas</h3>
            <Link to="/discover?city=London" className="text-sm font-semibold text-clay-accent hover:text-clay-accent-hover">
              View all
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            {areaCards.map((area) => (
              <Link
                key={area.name}
                to={`/discover?area=${encodeURIComponent(area.name)}`}
                className="group flex items-center justify-between rounded-xl border bg-background px-4 py-3 transition hover:-translate-y-0.5 hover:border-nokta-border-input"
              >
                <span>
                  <span className="block font-semibold">{area.name}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{area.count} venues</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-foreground px-6 py-12 text-center text-background sm:px-10">
          <img src="/nokta-dot-white-transparent.svg" alt="" className="mx-auto h-20 w-20 sm:h-24 sm:w-24" aria-hidden="true" />
          <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold sm:text-4xl">Ready to find your spot?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-background/70">
            Explore venues, save your shortlist and keep the next plan easy to choose.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-clay-accent text-white hover:bg-clay-accent-hover">
              <Link to="/discover">Explore venues</Link>
            </Button>
            <Button asChild variant="outline" className="border-background/25 text-background hover:bg-background/10">
              <Link to="/recommend">Find a recommendation</Link>
            </Button>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

function buildDiscoverPath(city: string, params: Record<string, string>) {
  const searchParams = new URLSearchParams({ city, ...params });
  return `/discover?${searchParams.toString()}`;
}

function LandingVenueGrid({ venues }: { venues: Venue[] }) {
  if (!venues.length) {
    return <VenueGrid venues={venues} />;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {venues.map((venue) => (
        <LandingVenueCard key={venue.id} venue={venue} />
      ))}
    </div>
  );
}

function HomepagePromoSectionSkeleton({ title }: { title: string }) {
  return (
    <section aria-label={`Loading ${title.toLowerCase()}`}>
      <div className="mb-6">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="mt-2 h-8 w-56" />
        <Skeleton className="mt-3 h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <article key={index} className="overflow-hidden rounded-2xl border border-nokta-border bg-card p-3 shadow-sm shadow-stone-950/5">
            <Skeleton className="h-36 rounded-xl" />
            <div className="space-y-3 px-1 py-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 rounded-full" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function LandingVenueGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading venues">
      {Array.from({ length: 4 }).map((_, index) => (
        <article key={index} className="overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface p-2">
          <Skeleton className="h-[190px] rounded-xl" />
          <div className="space-y-3 px-2 pb-2 pt-3">
            <Skeleton className="h-5 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
            <div className="flex items-center justify-between gap-3 pt-1">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function LandingVenueCard({ venue }: { venue: Venue }) {
  const currentStatus = getVenueCurrentStatus(venue);
  const currentStatusLabel = formatLandingStatus(currentStatus);

  return (
    <article className="group relative isolate overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface p-2 shadow-none transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-950/5">
      <CardMark className="-bottom-12 -right-10 h-32 w-32 opacity-[0.04]" />
      <div className="relative h-[190px] overflow-hidden rounded-xl bg-muted">
        <Link to={`/venues/${venue.slug}`} className="block h-full">
          <VenueImage
            venue={venue}
            alt={`${venue.name} interior`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        {venue.rating ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-nokta-ink shadow-sm">
            <Star className="h-3.5 w-3.5 fill-clay-accent text-clay-accent" />
            {venue.rating}
          </span>
        ) : null}
        <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="absolute right-3 top-3 h-8 w-8 text-clay-accent" />
      </div>
      <div className="px-2 pb-2 pt-3">
        <Link to={`/venues/${venue.slug}`} className="block">
          <h3 className="truncate text-[15px] font-semibold leading-5 text-nokta-ink">{venue.name}</h3>
          <p className="mt-0.5 truncate text-[13px] leading-5 text-nokta-ink-muted">{venue.area} · {formatVenuePrimaryCategory(venue.primaryCategory)}</p>
        </Link>
        {venue.priceFrom || currentStatusLabel ? (
          <div className="mt-4 flex items-center justify-between gap-3">
            {venue.priceFrom ? <span className="text-[13px] font-medium text-nokta-ink-muted">£{venue.priceFrom}+</span> : null}
            {currentStatusLabel ? (
              <span
                className={
                  currentStatus === "open"
                    ? "ml-auto rounded-full bg-nokta-accent-tint px-2.5 py-1 text-xs font-semibold text-nokta-accent-dark"
                    : "ml-auto rounded-full bg-red-950/10 px-2.5 py-1 text-xs font-semibold text-red-700"
                }
              >
                {currentStatusLabel}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CardMark({ className }: { className: string }) {
  return <img src="/nokta-dot.svg" alt="" aria-hidden="true" className={`pointer-events-none absolute -z-10 ${className}`} />;
}

function formatLandingStatus(status: ReturnType<typeof getVenueCurrentStatus>) {
  if (status === "open") {
    return "Open";
  }

  if (status === "closed") {
    return "Closed";
  }

  return null;
}

function getAreaCards(venues: Venue[], city: string) {
  const counts = venues.filter((venue) => venue.city === city).reduce<Record<string, number>>((areas, venue) => {
    areas[venue.area] = (areas[venue.area] ?? 0) + 1;
    return areas;
  }, {});

  const areaCards = Object.entries(counts)
    .sort(([, aCount], [, bCount]) => bCount - aCount)
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }));

  return areaCards.length
    ? areaCards
    : [
        { name: "Edgware Road", count: 8 },
        { name: "Mayfair", count: 5 },
        { name: "Shoreditch", count: 7 },
        { name: "Canary Wharf", count: 4 },
        { name: "Walthamstow", count: 3 },
        { name: "Bermondsey", count: 6 },
      ];
}

function getCityCards(venues: Venue[]) {
  return getActiveCities().map((city) => {
    const count = venues.filter((venue) => venue.country === city.country && venue.city === city.name).length;

    return {
      ...city,
      count,
    };
  });
}
