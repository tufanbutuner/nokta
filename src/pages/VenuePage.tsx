import { useEffect } from "react";
import { ExternalLink, MapPin, Star } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { VenueBadge } from "@/components/venues/VenueBadge";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { VenueVerificationBadge } from "@/components/venues/VenueVerificationBadge";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenue } from "@/hooks/useVenue";
import { getGoogleMapsDirectionsUrl } from "@/lib/directions";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { formatPriceLevel } from "@/lib/venueFilters";
import { getVenueImage } from "@/lib/venueImages";

export function VenuePage() {
  const { slug } = useParams();
  const { addRecentlyViewed } = useVenuePreferences();
  const { venue, isLoading, error } = useVenue(slug);

  useEffect(() => {
    if (venue) {
      void addRecentlyViewed(venue.id);
    }
  }, [addRecentlyViewed, venue]);

  if (isLoading) {
    return (
      <main>
        <PageContainer className="py-20">
          <LoadingState message="Loading venue..." />
        </PageContainer>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <PageContainer className="py-20">
          <ErrorState message={error} />
        </PageContainer>
      </main>
    );
  }

  if (!venue) {
    return (
      <PageContainer className="py-20">
        <h1 className="text-3xl font-semibold">Venue not found</h1>
        <Button asChild className="mt-6">
          <Link reloadDocument to="/discover">Back to discover</Link>
        </Button>
      </PageContainer>
    );
  }

  const amenities = [
    venue.food && "Food",
    venue.outdoor && "Outdoor seating",
    venue.indoor && "Indoor seating",
    venue.alcohol && "Alcohol",
    venue.openLate && "Open late",
  ].filter((amenity): amenity is string => Boolean(amenity));
  const currentStatus = getVenueCurrentStatus(venue);
  const headerDetails = [
    `${venue.area}, London`,
    venue.priceFrom ? `Shisha from £${venue.priceFrom}` : "Shisha price TBC",
    formatPriceLevel(venue.priceLevel),
    venue.outdoor ? "Outdoor seating" : "Indoor seating",
    formatCurrentStatus(currentStatus),
  ];

  return (
    <main>
      <PageContainer className="py-10">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link reloadDocument to="/discover" className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground">
              Back to discover
            </Link>
            <h1 className="text-5xl font-semibold">{venue.name}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {headerDetails.map((detail, index) => (
                <span key={detail} className="inline-flex items-center gap-2">
                  {index > 0 ? <span aria-hidden="true">·</span> : null}
                  <span>{detail}</span>
                </span>
              ))}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {venue.rating ? (
              <div className="flex items-center gap-2 text-lg">
                <Star className="h-5 w-5 fill-foreground" />
                {venue.rating}
              </div>
            ) : null}
            <FavouriteButton venueId={venue.id} venueName={venue.name} className="h-10 w-10 border" />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="aspect-[16/7] w-full object-cover" />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {venue.vibes.map((vibe) => (
            <VenueBadge key={vibe} label={vibe} />
          ))}
        </div>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_340px]">
          <article className="space-y-10">
            <section>
              <h2 className="text-2xl font-semibold">About</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">{venue.description}</p>
            </section>
            <Separator />
            <section className="grid gap-8 sm:grid-cols-3">
              <div>
                <h3 className="mb-3 font-semibold">Shisha</h3>
                <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
              </div>
              <div>
                <h3 className="mb-3 font-semibold">Atmosphere</h3>
                <p className="text-muted-foreground">{venue.vibes.map((vibe) => vibe.replace("-", " ")).join(" · ")}</p>
              </div>
              <div>
                <h3 className="mb-3 font-semibold">Amenities</h3>
                <ul className="space-y-2 text-muted-foreground">
                  {amenities.map((amenity) => (
                    <li key={amenity}>✓ {amenity}</li>
                  ))}
                </ul>
              </div>
            </section>
            <Separator />
            <section>
              <h2 className="text-2xl font-semibold">Opening hours</h2>
              <div className="mt-5 grid gap-3">
                {venue.openingHours.map((item) => (
                  <div key={item.day} className="grid grid-cols-[120px_1fr] text-sm">
                    <span className="font-medium">{item.day}</span>
                    <span className="text-muted-foreground">
                      {item.open} – {item.close}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            <Separator />
            <section className="rounded-lg border bg-card p-5">
              <h2 className="text-2xl font-semibold">Venue information</h2>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground">Status</span>
                <VenueVerificationBadge status={venue.verificationStatus} />
                {venue.lastVerifiedAt ? (
                  <span className="text-sm text-muted-foreground">Last checked {formatVerifiedDate(venue.lastVerifiedAt)}</span>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Venue details can change. Always check directly with the venue before travelling or booking.
              </p>
              {venue.sourceNotes ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{venue.sourceNotes}</p> : null}
            </section>
          </article>

          <aside className="h-fit rounded-lg border bg-card p-5">
            <h2 className="font-semibold">Location</h2>
            <p className="mt-4 text-muted-foreground">
              {venue.address}
              <br />
              {venue.area}
              <br />
              London {venue.postcode}
            </p>
            <div className="mt-6 grid gap-3">
              <Button asChild>
                <a href={getGoogleMapsDirectionsUrl(venue)} target="_blank" rel="noreferrer">
                  Get directions
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              {venue.website ? (
                <Button asChild variant="outline">
                  <a href={venue.website} target="_blank" rel="noreferrer">
                    Visit website
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              ) : null}
            </div>
          </aside>
        </div>
      </PageContainer>
    </main>
  );
}

function formatVerifiedDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatCurrentStatus(status: ReturnType<typeof getVenueCurrentStatus>) {
  if (status === "open") {
    return "Open now";
  }

  if (status === "closed") {
    return "Closed now";
  }

  return "Hours TBC";
}
