import { VenueMap } from "@/components/map/VenueMap";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VenueVerificationBadge } from "@/components/venues/VenueVerificationBadge";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import { formatPriceLevel } from "@/lib/venueFilters";
import { getVenueImage } from "@/lib/venueImages";
import { formatPenceAsPrice } from "@/lib/venueMenuValidation";
import { getPublicVenueMenu } from "@/services/venueMenuService";
import type { Venue } from "@/types/venue";
import type { VenueMenu } from "@/types/venueMenu";
import { Clock, Sofa, Star, Utensils } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";

export function PlanYourVisitCard({ venue }: { venue: Venue }) {
  return (
    <section className="rounded-2xl border border-nokta-border bg-white p-5 shadow-sm shadow-stone-950/5">
      <h2 className="font-semibold text-nokta-ink">Plan your visit</h2>
      <div className="mt-4 grid gap-5">
        <div>
          <h3 className="text-[13px] font-semibold uppercase text-nokta-ink-muted">Opening hours</h3>
          <div className="mt-3 grid gap-2">
            {venue.openingHours.length ? (
              venue.openingHours.map((item) => (
                <div key={item.day} className="grid grid-cols-[96px_1fr] gap-3 text-[13px]">
                  <span className="font-medium text-nokta-ink">{item.day}</span>
                  <span className="text-nokta-ink-muted">
                    {item.open} • {item.close}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-nokta-ink-muted">Opening hours TBC</p>
            )}
          </div>
        </div>

        <div className="border-t border-nokta-border pt-5">
          <h3 className="text-[13px] font-semibold uppercase text-nokta-ink-muted">Location</h3>
          <p className="mt-3 text-sm leading-6 text-nokta-ink-muted">
            {venue.address}
            <br />
            {venue.area}
            <br />
            {venue.city} {venue.postcode}
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-nokta-border">
            <VenueMap venues={[venue]} selectedVenueId={venue.id} city={venue.city} className="h-72 rounded-none border-0 [&_.leaflet-container]:!min-h-72 [&_.leaflet-control-container]:relative [&_.leaflet-control-container]:z-0 md:[&_.leaflet-container]:!min-h-72" />
          </div>
        </div>

        <div className="border-t border-nokta-border pt-5">
          <h3 className="text-[13px] font-semibold uppercase text-nokta-ink-muted">Venue information</h3>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <VenueVerificationBadge status={venue.verificationStatus} />
            {venue.lastVerifiedAt ? <span className="text-sm text-nokta-ink-muted">Checked {formatVerifiedDate(venue.lastVerifiedAt)}</span> : null}
          </div>
          <p className="mt-4 text-sm leading-6 text-nokta-ink-muted">Venue details can change. Check directly before travelling or booking.</p>
          {venue.sourceNotes ? <p className="mt-3 text-sm leading-6 text-nokta-ink-muted">{venue.sourceNotes}</p> : null}
        </div>
      </div>
    </section>
  );
}

export function OverviewTab({ venue, amenities, similarVenues }: { venue: Venue; amenities: string[]; similarVenues: Venue[] }) {
  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <article className="min-w-0 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-nokta-ink">Key details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailTile icon={<Clock className="h-4 w-4" />} label="Hours" value={formatCurrentStatus(getVenueCurrentStatus(venue))} />
            <DetailTile icon={<Star className="h-4 w-4" />} label="Rating" value={venue.rating ? `${venue.rating} / 5` : "Rating TBC"} />
            <DetailTile icon={<Sofa className="h-4 w-4" />} label="Seating" value={venue.outdoor ? "Outdoor seating" : venue.indoor ? "Indoor seating" : "Seating TBC"} />
            <DetailTile icon={<Utensils className="h-4 w-4" />} label="Food & drinks" value={formatFoodDrinks(venue)} />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-nokta-ink">Amenities</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.length ? (
              amenities.map((amenity) => (
                <Badge key={amenity} variant="outline" className="rounded-full border-nokta-border bg-white px-3 py-1.5 text-[13px] font-medium text-nokta-ink">
                  {amenity}
                </Badge>
              ))
            ) : (
              <p className="text-nokta-ink-muted">Amenities TBC</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-nokta-ink">Similar venues</h2>
          <SimilarVenueCarousel venues={similarVenues} />
        </section>

        <ClaimVenueBanner venue={venue} />
      </article>

      <aside className="min-w-0">
        <PlanYourVisitCard venue={venue} />
      </aside>
    </div>
  );
}

function DetailTile({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-nokta-border bg-white p-4 shadow-sm shadow-stone-950/5">
      <div className="flex items-center gap-2 text-[13px] font-medium text-nokta-ink-muted">
        {icon}
        {label}
      </div>
      <p className="mt-3 text-[15px] font-semibold text-nokta-ink">{value}</p>
    </div>
  );
}

function formatFoodDrinks(venue: Venue) {
  if (venue.food && venue.alcohol) return "Food and alcohol";
  if (venue.food) return "Food available";
  if (venue.alcohol) return "Alcohol available";
  return "Not listed";
}

function ClaimVenueBanner({ venue }: { venue: Venue }) {
  if (venue.isClaimed) return null;

  return (
    <section className="rounded-2xl border border-nokta-border bg-white p-5 shadow-sm shadow-stone-950/5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-nokta-ink">Own or manage this venue?</h2>
          <p className="mt-1 text-sm leading-6 text-nokta-ink-muted">Claim this profile to keep details accurate, respond to enquiries and manage bookings.</p>
        </div>
        <Button asChild className="h-10 shrink-0 rounded-lg bg-nokta-ink px-4 text-sm font-medium text-white hover:bg-nokta-ink/90">
          <Link to={`/venues/${venue.slug}/claim`}>Claim venue</Link>
        </Button>
      </div>
    </section>
  );
}

export function MenuTab({ venue }: { venue: Venue }) {
  const [menu, setMenu] = useState<VenueMenu | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPublicVenueMenu(venue.id)
      .then((nextMenu) => {
        if (!cancelled) setMenu(nextMenu);
      })
      .catch(() => {
        if (!cancelled) setMenu(null);
      });
    return () => {
      cancelled = true;
    };
  }, [venue.id]);

  const rows = [
    ["Shisha", venue.priceFrom ? `From £${venue.priceFrom}` : "Price TBC"],
    ["Price tier", formatPriceLevel(venue.priceLevel)],
    ["Food", venue.food ? "Available" : "Not listed"],
    ["Alcohol", venue.alcohol ? "Available" : "Not listed"],
  ];
  const menuLink = venue.dataSources.shishaMenuUrl ?? venue.dataSources.menuUrl;

  return (
    <section className="max-w-3xl">
      <h2 className="text-2xl font-semibold text-nokta-ink">Menu & prices</h2>
      <div className="mt-5 overflow-hidden rounded-2xl border border-nokta-border bg-white shadow-sm shadow-stone-950/5">
        {rows.map(([label, value], index) => (
          <div key={label} className={cn("grid grid-cols-[1fr_auto] gap-4 p-4 text-sm", index > 0 && "border-t border-nokta-border")}>
            <span className="font-medium text-nokta-ink">{label}</span>
            <span className="text-nokta-ink-muted">{value}</span>
          </div>
        ))}
      </div>

      {/* Items win over a link when the venue maintains both. */}
      {menu?.items.length ? (
        <div className="mt-6 space-y-5">
          {menu.sections.map((section) => {
            const sectionItems = menu.items.filter((item) => item.sectionId === section.id);
            if (!sectionItems.length) return null;
            return (
              <div key={section.id}>
                <h3 className="text-sm font-semibold uppercase tracking-[0.5px] text-nokta-ink">{section.name}</h3>
                <div className="mt-3 overflow-hidden rounded-2xl border border-nokta-border bg-white">
                  {sectionItems.map((item, index) => (
                    <div key={item.id} className={cn("flex items-baseline justify-between gap-4 p-4 text-sm", index > 0 && "border-t border-nokta-border")}>
                      <div className="min-w-0">
                        <span className="font-medium text-nokta-ink">{item.name}</span>
                        {item.note ? <p className="mt-0.5 text-nokta-ink-muted">{item.note}</p> : null}
                      </div>
                      <span className="flex-none font-medium text-nokta-ink">{formatPenceAsPrice(item.pricePence)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : menuLink ? (
        <a href={menuLink} target="_blank" rel="noreferrer noopener" className="mt-4 inline-block text-sm font-medium text-clay-accent hover:underline">View the full menu →</a>
      ) : (
        <p className="mt-4 text-sm text-nokta-ink-muted">Detailed flavour and food menus will appear here once verified source data is available.</p>
      )}
    </section>
  );
}

export function ReviewsTab({ venue }: { venue: Venue }) {
  return <ReviewSection venue={venue} />;
}

function SimilarVenueCarousel({ venues }: { venues: Venue[] }) {
  if (!venues.length) {
    return <p className="mt-4 text-muted-foreground">Similar venues will appear as the venue catalogue grows.</p>;
  }

  return (
    <div className="-mx-4 mt-4 flex max-w-[calc(100%+2rem)] gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:max-w-full sm:px-0">
      {venues.map((venue) => (
        <Link key={venue.id} to={`/venues/${venue.slug}`} className="group w-[220px] shrink-0 rounded-2xl border border-nokta-border bg-white p-2 shadow-none transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-950/5">
          <div className="relative h-[110px] overflow-hidden rounded-xl bg-muted">
            <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            {venue.rating ? (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-nokta-ink shadow-sm">
                <Star className="h-3.5 w-3.5 fill-nokta-ink text-nokta-ink" />
                {venue.rating}
              </span>
            ) : null}
          </div>
          <div className="px-1 pb-1 pt-3">
            <h3 className="truncate text-sm font-semibold leading-5 text-nokta-ink">{venue.name}</h3>
            <p className="mt-0.5 truncate text-xs leading-5 text-nokta-ink-muted">{venue.area}</p>
          </div>
        </Link>
      ))}
    </div>
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
  if (status === "open") return "Open now";
  if (status === "closed") return "Closed now";
  return "Hours TBC";
}
