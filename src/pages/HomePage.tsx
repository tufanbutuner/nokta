import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { RecentlyViewedVenues } from "@/components/venues/RecentlyViewedVenues";
import { VenueGrid } from "@/components/venues/VenueGrid";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { venues } from "@/data/venues";

const featured = venues.slice(0, 3);
const neighbourhoods = ["Edgware Road", "Mayfair", "Canary Wharf", "Shoreditch", "Walthamstow"];
const vibes = ["Outdoor", "Late Night", "Luxury", "Date Night", "Casual"];

export function HomePage() {
  return (
    <main>
      <section className="border-b">
        <PageContainer className="grid gap-10 py-16 lg:grid-cols-[1fr_420px] lg:items-end lg:py-24">
          <div>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">London shisha guide</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] sm:text-6xl lg:text-7xl">
              Find your next shisha spot in London.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              A curated discovery app for lounges, terraces and late-night tables across the city.
            </p>
            <div className="mt-8 max-w-2xl rounded-lg border bg-card p-2 shadow-xl shadow-stone-950/5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="border-0 pl-9 shadow-none focus-visible:ring-0" placeholder="Search venues, areas or vibes..." />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {vibes.slice(0, 3).map((vibe) => (
                <Badge key={vibe} variant="outline" className="bg-card/70">
                  {vibe}
                </Badge>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border bg-card">
            <img
              src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=85"
              alt="Atmospheric lounge interior"
              className="aspect-[4/5] w-full object-cover"
            />
          </div>
        </PageContainer>
      </section>

      <PageContainer className="space-y-16 py-14">
        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Popular right now</p>
              <h2 className="text-3xl font-semibold">Book-worthy lounges</h2>
            </div>
            <Button asChild variant="outline">
              <Link reloadDocument to="/discover">
                Discover all
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <VenueGrid venues={featured} />
        </section>

        <RecentlyViewedVenues />

        <section className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="mb-3 text-sm text-muted-foreground">Explore London</p>
            <div className="flex flex-wrap gap-2">
              {neighbourhoods.map((area) => (
                <Badge key={area} variant="secondary" className="px-3 py-1.5 text-sm">
                  {area}
                </Badge>
              ))}
            </div>
          </div>
          <div id="about">
            <p className="mb-3 text-sm text-muted-foreground">Find your vibe</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {vibes.map((vibe) => (
                <div key={vibe} className="rounded-lg border bg-card p-4 text-sm font-medium">
                  {vibe}
                </div>
              ))}
            </div>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
