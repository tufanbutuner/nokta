import { useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, BookmarkCheck, ChevronRight, MapPin, MessageCircle, Search, Sparkles, Star } from "lucide-react";
import { HomepageFeaturedVenues } from "@/components/featured/HomepageFeaturedVenues";
import { PageContainer } from "@/components/layout/PageContainer";
import { HomepageOffersSection } from "@/components/offers/HomepageOffersSection";
import { PageMeta } from "@/components/seo/PageMeta";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useVenues } from "@/hooks/useVenues";
import { brandConfig } from "@/config/brand";
import { DEFAULT_CITY, getActiveCities } from "@/lib/cities";
import { getVenueImage } from "@/lib/venueImages";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import type { Venue } from "@/types/venue";

const quickFilters = [
  { label: "London", to: "/discover?city=London" },
  { label: "Near me", to: "/discover?city=London&sort=nearest" },
  { label: "Open now", to: "/discover?city=London&status=open" },
  { label: "Under £20", to: "/discover?city=London&price=1" },
  { label: "Top rated", to: "/discover?city=London&rating=4" },
] as const;

const steps: { title: string; description: string; Icon: LucideIcon }[] = [
  {
    title: "Search",
    description: "Find lounges by city, area, vibe, price and the details that matter before you travel.",
    Icon: Search,
  },
  {
    title: "Save",
    description: "Keep a shortlist of places you want to try, from late-night lounges to quiet terraces.",
    Icon: BookmarkCheck,
  },
  {
    title: "Rate",
    description: "Share what the venue was actually like so other people can choose well.",
    Icon: MessageCircle,
  },
];

const testimonials = [
  {
    quote: "Finally, a way to compare shisha spots without opening ten different tabs.",
    name: "Aisha",
    area: "Bermondsey",
  },
  {
    quote: "The filters are exactly how we pick a place: outdoor, late, decent price.",
    name: "Rami",
    area: "Edgware Road",
  },
  {
    quote: "Feels more curated than a directory. The saved list has become our weekend shortlist.",
    name: "Maya",
    area: "Shoreditch",
  },
];

const CITY_DESCRIPTIONS: Record<string, string> = {
  London: "Explore social venues across London by area, vibe, price and distance.",
  Birmingham: "Find lounges and late-night social venues across Birmingham.",
  Manchester: "Discover social venues across Manchester for casual nights, groups and late plans.",
  Leicester: "Browse social venues across Leicester by vibe, features and location.",
};

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { venues, isLoading, error } = useVenues();
  const featured = venues.slice(0, 4);
  const areaCards = useMemo(() => getAreaCards(venues, DEFAULT_CITY), [venues]);
  const cityCards = useMemo(() => getCityCards(venues), [venues]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    navigate(params.toString() ? `/discover?${params.toString()}` : "/discover");
  }

  return (
    <main>
      <PageMeta
        title={`Discover Social Venues Across the UK | ${brandConfig.appName}`}
        description="Find lounges, restaurants, bars and cafes across the UK. Discover venue details, photos, opening info and request bookings, starting with shisha lounges."
        canonicalPath="/"
      />
      <section className="border-b">
        <PageContainer className="py-12 sm:py-16 lg:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mx-auto max-w-4xl text-5xl font-semibold leading-[0.95] sm:text-6xl lg:text-7xl">
              Discover social venues
              <span className="mt-1 block text-clay-accent">worth going out for</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Find shisha lounges, restaurants, bars and cafes across the UK.
            </p>

            <form className="mx-auto mt-8 max-w-3xl rounded-2xl border bg-card p-2 shadow-xl shadow-stone-950/5" onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 border-0 bg-transparent pl-9 pr-14 shadow-none focus-visible:ring-0 sm:pr-56"
                  placeholder="Search venues, areas or vibes..."
                />
                <div className="absolute right-28 top-1/2 hidden h-8 -translate-y-1/2 items-center gap-2 border-l px-4 text-sm text-muted-foreground sm:flex">
                  <MapPin className="h-4 w-4" />
                  London
                </div>
                <Button type="submit" className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 bg-clay-accent px-0 text-white hover:bg-clay-accent-hover sm:w-24 sm:px-4">
                  <Search className="h-4 w-4 sm:hidden" />
                  <span className="sr-only sm:not-sr-only">Explore</span>
                </Button>
              </div>
            </form>

            <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
              {quickFilters.map((filter) => (
                <Link key={filter.label} reloadDocument to={filter.to}>
                  <Badge variant="outline" className="border-transparent bg-foreground/5 px-3 py-1.5 text-xs text-foreground/75 hover:bg-foreground/10">
                    {filter.label}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>

        </PageContainer>
      </section>

      <section className="border-b border-sheesh-ink bg-sheesh-ink">
        <PageContainer className="grid gap-4 py-6 text-center text-sm text-clay-50/60 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center sm:text-left">
          <p className="font-medium text-clay-50">{brandConfig.shortDescription}</p>
          <span>Late-night plans</span>
          <span>Group bookings</span>
          <span>Venue details</span>
        </PageContainer>
      </section>

      <PageContainer className="space-y-16 py-12 sm:py-16">
        {!isLoading && !error ? <HomepageFeaturedVenues venues={venues} /> : null}
        {!isLoading && !error ? <HomepageOffersSection venues={venues} /> : null}

        <section>
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-clay-accent">Popular near you</p>
              <h2 className="mt-1 text-3xl font-semibold">Book-worthy venues</h2>
            </div>
            <Button asChild variant="outline" className="w-fit">
              <Link reloadDocument to="/discover">
                View all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {isLoading ? <LoadingState /> : error ? <ErrorState message={error} /> : <LandingVenueGrid venues={featured} />}
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm text-clay-accent">Browse by area</p>
            <h2 className="mt-1 text-3xl font-semibold">Start with the part of London you know</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {areaCards.map((area) => (
              <Link
                key={area.name}
                reloadDocument
                to={`/discover?area=${encodeURIComponent(area.name)}`}
                className="group flex items-center justify-between rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-950/5"
              >
                <span>
                  <span className="block font-semibold">{area.name}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{area.count} venues</span>
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm text-clay-accent">Explore by city</p>
            <h2 className="mt-1 text-3xl font-semibold">Explore city by city</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {cityCards.map((city) => (
              <article key={city.slug} className="rounded-xl border bg-card p-5 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-stone-950/5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{city.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{city.count === 1 ? "1 venue listed" : `${city.count} venues listed`}</p>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">{city.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/cities/${city.slug}`}>City page</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to={`/discover?city=${encodeURIComponent(city.name)}`}>Discover</Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-card px-5 py-10 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-clay-accent">How it works</p>
            <h2 className="mt-3 text-3xl font-semibold">Three steps to your next plan</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map(({ title, description, Icon }) => (
              <div key={title} className="rounded-xl border bg-background p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-clay-accent/10 text-clay-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6">
            <p className="text-sm text-clay-accent">Word around town</p>
            <h2 className="mt-1 text-3xl font-semibold">Built for how people actually choose</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <div key={testimonial.name} className="rounded-xl border bg-card p-5">
                <div className="flex gap-1 text-clay-accent" aria-label="5 star review">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 leading-7 text-foreground/85">"{testimonial.quote}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-clay-accent/10 text-sm font-semibold text-clay-accent">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.area}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl bg-foreground px-6 py-12 text-center text-background sm:px-10">
          <Sparkles className="mx-auto h-8 w-8 text-clay-accent" />
          <h2 className="mx-auto mt-4 max-w-xl text-3xl font-semibold sm:text-4xl">Ready to find your spot?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-background/70">
            Explore venues, save your shortlist and keep the next plan easy to choose.
          </p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="bg-clay-accent text-white hover:bg-clay-accent-hover">
              <Link reloadDocument to="/discover">Get started free</Link>
            </Button>
            <Button asChild variant="outline" className="border-background/25 text-background hover:bg-background/10">
              <Link reloadDocument to="/recommend">Find a recommendation</Link>
            </Button>
          </div>
        </section>
      </PageContainer>
    </main>
  );
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

function LandingVenueCard({ venue }: { venue: Venue }) {
  const currentStatus = getVenueCurrentStatus(venue);

  return (
    <article className="group overflow-hidden rounded-xl border bg-card transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-950/5">
      <div className="relative h-[190px] overflow-hidden bg-muted">
        <Link reloadDocument to={`/venues/${venue.slug}`} className="block h-full">
          <img
            src={getVenueImage(venue)}
            alt={`${venue.name} interior`}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </Link>
        {venue.rating ? (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-clay-accent text-clay-accent" />
            {venue.rating}
          </span>
        ) : null}
        <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="absolute right-3 top-3 h-8 w-8 text-clay-accent" />
      </div>
      <div className="p-4">
        <Link reloadDocument to={`/venues/${venue.slug}`} className="block">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="line-clamp-1 min-w-0 font-semibold">{venue.name}</h3>
            {venue.isClaimed ? <ClaimedVenueBadge compact /> : null}
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{venue.area}</p>
        </Link>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">{venue.priceFrom ? `£${venue.priceFrom}+` : "Price TBC"}</span>
          <span
            className={
              currentStatus === "open"
                ? "rounded-full bg-clay-accent/10 px-2 py-1 text-xs font-medium text-clay-accent"
                : currentStatus === "closed"
                  ? "rounded-full bg-red-950/10 px-2 py-1 text-xs font-medium text-red-700"
                  : "rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
            }
          >
            {formatLandingStatus(currentStatus)}
          </span>
        </div>
      </div>
    </article>
  );
}

function formatLandingStatus(status: ReturnType<typeof getVenueCurrentStatus>) {
  if (status === "open") {
    return "Open";
  }

  if (status === "closed") {
    return "Closed";
  }

  return "Hours TBC";
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
      description: CITY_DESCRIPTIONS[city.name] ?? `Explore social venues across ${city.name}.`,
    };
  });
}
