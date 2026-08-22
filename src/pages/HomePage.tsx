import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { RecentlyViewedVenues } from "@/components/venues/RecentlyViewedVenues";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { useVenues } from "@/hooks/useVenues";

const vibes = [
  { label: "Outdoor", value: "outdoor" },
  { label: "Late Night", value: "late-night" },
  { label: "Luxury", value: "luxury" },
  { label: "Date Night", value: "date-night" },
  { label: "Casual", value: "casual" },
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const { venues, isLoading, error } = useVenues();
  const featured = venues.slice(0, 3);
  const neighbourhoods = Array.from(new Set(venues.map((venue) => venue.area))).slice(0, 5);

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
      <section className="overflow-hidden border-b">
        <PageContainer className="grid gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_420px] lg:items-end lg:gap-10 lg:py-24">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:mb-4">Sheesha guide</p>
            <h1 className="max-w-3xl text-4xl font-semibold leading-none sm:text-6xl lg:text-7xl">
              Find your next sheesha spot in London.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:mt-6 sm:text-lg sm:leading-8">
              A curated discovery app for lounges, terraces and late-night tables across the city.
            </p>
            <form className="mt-6 max-w-2xl rounded-2xl border bg-card p-1.5 shadow-xl shadow-stone-950/5 sm:mt-8 sm:p-2" onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="min-w-0 border-0 bg-transparent pl-9 pr-14 shadow-none focus-visible:ring-0 sm:pr-28"
                  placeholder="Search venues, areas or vibes..."
                />
                <Button type="submit" className="absolute right-0 top-1/2 h-10 w-10 -translate-y-1/2 px-0 sm:w-auto sm:min-w-24 sm:px-4">
                  <Search className="h-4 w-4 sm:hidden" />
                  <span className="sr-only sm:not-sr-only">Search</span>
                </Button>
              </div>
            </form>
            <div className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center">
              <p className="text-sm text-muted-foreground">Not sure where to go?</p>
              <Button asChild className="w-fit">
                <Link reloadDocument to="/recommend">
                  Find your spot
                </Link>
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {vibes.slice(0, 3).map((vibe) => (
                <Link key={vibe.value} reloadDocument to={`/discover?vibes=${vibe.value}`}>
                  <Badge variant="outline" className="bg-card/70 hover:border-foreground">
                    {vibe.label}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <div className="-mx-4 h-64 overflow-hidden border-y bg-card sm:mx-0 sm:h-auto sm:rounded-xl sm:border lg:rounded-lg">
            <img
              src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85"
              alt="Atmospheric lounge interior"
              className="h-full w-full object-cover sm:aspect-[16/10] sm:h-auto lg:aspect-[4/5]"
            />
          </div>
        </PageContainer>
      </section>

      <PageContainer className="space-y-12 py-10 sm:space-y-16 sm:py-14">
        <section>
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm text-muted-foreground">Popular right now</p>
              <h2 className="text-2xl font-semibold sm:text-3xl">Book-worthy lounges</h2>
            </div>
            <Button asChild variant="outline" className="w-fit">
              <Link reloadDocument to="/discover">
                Discover all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          {isLoading ? <LoadingState /> : error ? <ErrorState message={error} /> : <VenueGrid venues={featured} />}
        </section>

        {!isLoading && !error ? <RecentlyViewedVenues venues={venues} /> : null}

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Explore London</p>
            <div className="flex flex-wrap gap-2">
              {(neighbourhoods.length ? neighbourhoods : ["Edgware Road", "Mayfair", "Canary Wharf", "Shoreditch", "Walthamstow"]).map((area) => (
                <Link key={area} reloadDocument to={`/discover?area=${encodeURIComponent(area)}`}>
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm hover:bg-secondary/80">
                    {area}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
          <div id="about">
            <p className="mb-3 text-sm text-muted-foreground">Find your vibe</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
              {vibes.map((vibe) => (
                <Link
                  key={vibe.value}
                  reloadDocument
                  to={`/discover?vibes=${vibe.value}`}
                  className="rounded-xl border bg-card p-3 text-sm font-medium hover:border-foreground sm:rounded-lg sm:p-4"
                >
                  {vibe.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
