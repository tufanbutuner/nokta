import { useEffect, useState } from "react";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Flag,
  MapPin,
  Navigation,
  Phone,
  Share2,
  Sofa,
  Star,
  Utensils,
  X,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { VenueMap } from "@/components/map/VenueMap";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { VenueBadge } from "@/components/venues/VenueBadge";
import { VenuePrice } from "@/components/venues/VenuePrice";
import { VenueVerificationBadge } from "@/components/venues/VenueVerificationBadge";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAppLocation } from "@/context/AppLocationContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenue } from "@/hooks/useVenue";
import { useVenues } from "@/hooks/useVenues";
import { getGoogleMapsDirectionsUrl } from "@/lib/directions";
import { formatDistanceMiles, getVenueDistanceMiles } from "@/lib/location";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import { formatPriceLevel } from "@/lib/venueFilters";
import { getVenueImage, getVenueImages } from "@/lib/venueImages";
import type { Venue } from "@/types/venue";

type VenueDetailTab = "overview" | "menu" | "reviews" | "photos";

const VENUE_TABS: { label: string; value: VenueDetailTab }[] = [
  { label: "Overview", value: "overview" },
  { label: "Menu & Prices", value: "menu" },
  { label: "Reviews", value: "reviews" },
  { label: "Photos", value: "photos" },
];

export function VenuePage() {
  const { slug } = useParams();
  const { addRecentlyViewed } = useVenuePreferences();
  const { venue, isLoading, error } = useVenue(slug);
  const { venues } = useVenues();
  const { userLocation } = useAppLocation();
  const [activeTab, setActiveTab] = useState<VenueDetailTab>("overview");
  const [shareLabel, setShareLabel] = useState("Share");
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

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

  const currentStatus = getVenueCurrentStatus(venue);
  const distanceLabel = userLocation ? formatDistanceMiles(getVenueDistanceMiles(venue, userLocation)).replace(" away", "") : null;
  const amenities = [
    venue.food && "Food",
    venue.outdoor && "Outdoor seating",
    venue.indoor && "Indoor seating",
    venue.alcohol && "Alcohol",
    venue.openLate && "Open late",
  ].filter((amenity): amenity is string => Boolean(amenity));
  const galleryImages = getVenueImages(venue);
  const similarVenues = venues
    .filter((candidate) => candidate.id !== venue.id && (candidate.area === venue.area || candidate.vibes.some((vibe) => venue.vibes.includes(vibe))))
    .slice(0, 6);

  async function shareVenue() {
    if (!venue) {
      return;
    }

    const url = window.location.href;
    const title = venue.name;
    const text = venue.description;

    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShareLabel("Copied");
        window.setTimeout(() => setShareLabel("Share"), 1800);
      }
    } catch {
      setShareLabel("Share");
    }
  }

  return (
    <main className="bg-background">
      <PageContainer className="py-6 sm:py-8">
        <Link reloadDocument to="/discover" className="mb-4 inline-flex text-sm font-medium text-muted-foreground hover:text-foreground">
          Back to discover
        </Link>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap gap-2">
              {venue.vibes.slice(0, 5).map((vibe) => (
                <VenueBadge key={vibe} label={vibe} />
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">{venue.name}</h1>
              <CurrentStatusBadge status={currentStatus} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
              {venue.rating ? (
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                  <Star className="h-4 w-4 fill-clay-accent text-clay-accent" />
                  {venue.rating}
                </span>
              ) : null}
              <span>Reviews coming soon</span>
              <span className="hidden sm:inline" aria-hidden="true">
                -
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {venue.area}
                {distanceLabel ? ` - ${distanceLabel}` : null}
              </span>
              <span className="hidden sm:inline" aria-hidden="true">
                -
              </span>
              <span>{venue.priceFrom ? `Shisha from £${venue.priceFrom}` : "Shisha price TBC"}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FavouriteButton venueId={venue.id} venueName={venue.name} className="h-11 w-11 border" />
          </div>
        </section>

        <div className="mt-6">
          <PhotoGallery venue={venue} images={galleryImages} onOpenImage={setActiveImageIndex} />
        </div>

        <ActionBar venue={venue} shareLabel={shareLabel} onShare={shareVenue} />

        <div className="sticky top-16 z-30 mt-6 border-b bg-background/95 backdrop-blur">
          <div className="flex gap-2 overflow-x-auto py-2">
            {VENUE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={cn(
                  "h-9 shrink-0 rounded-lg px-3 text-sm font-medium transition-colors",
                  activeTab === tab.value ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                onClick={() => setActiveTab(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8">
          {activeTab === "overview" ? (
            <OverviewTab venue={venue} amenities={amenities} similarVenues={similarVenues} />
          ) : null}
          {activeTab === "menu" ? <MenuTab venue={venue} /> : null}
          {activeTab === "reviews" ? <ReviewsTab venue={venue} /> : null}
          {activeTab === "photos" ? <PhotosTab venue={venue} images={galleryImages} onOpenImage={setActiveImageIndex} /> : null}
        </div>
      </PageContainer>

      {activeImageIndex !== null ? (
        <PhotoLightbox
          venue={venue}
          images={galleryImages}
          activeIndex={activeImageIndex}
          onChange={setActiveImageIndex}
          onClose={() => setActiveImageIndex(null)}
        />
      ) : null}
    </main>
  );
}

function PhotoGallery({ venue, images, onOpenImage }: { venue: Venue; images: string[]; onOpenImage: (index: number) => void }) {
  const primaryImage = images[0] ?? getVenueImage(venue);
  const secondaryImages = images.slice(1, 5);
  const galleryCount = images.length;

  if (!secondaryImages.length) {
    return (
      <section className="relative overflow-hidden rounded-xl border bg-card">
        <button type="button" className="block w-full overflow-hidden text-left" onClick={() => onOpenImage(0)}>
          <img src={primaryImage} alt={`${venue.name} main gallery`} className="aspect-[16/7] w-full object-cover transition duration-500 hover:scale-[1.02]" />
        </button>
        <PhotoCountBadge current={1} total={galleryCount} />
      </section>
    );
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border bg-card lg:hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto">
          {images.map((image, index) => (
            <button key={`${image}-mobile-${index}`} type="button" className="relative block min-w-full snap-center overflow-hidden text-left" onClick={() => onOpenImage(index)}>
              <img src={image} alt={`${venue.name} gallery ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
              <PhotoCountBadge current={index + 1} total={galleryCount} />
            </button>
          ))}
        </div>
      </section>

      <section className="hidden gap-3 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.9fr)]">
        <div className="relative overflow-hidden rounded-xl border bg-card">
          <button type="button" className="block h-full w-full overflow-hidden text-left" onClick={() => onOpenImage(0)}>
            <img src={primaryImage} alt={`${venue.name} main gallery`} className="aspect-[16/9] h-full w-full object-cover transition duration-500 hover:scale-[1.02] lg:aspect-[16/8]" />
          </button>
          <PhotoCountBadge current={1} total={galleryCount} />
        </div>
        <div className="grid grid-cols-2 gap-3 overflow-x-auto lg:grid-cols-2">
          {secondaryImages.slice(0, 4).map((image, index) => (
            <div key={`${image}-${index}`} className="overflow-hidden rounded-xl border bg-card">
              <button type="button" className="block h-full w-full overflow-hidden text-left" onClick={() => onOpenImage(index + 1)}>
                <img src={image} alt={`${venue.name} gallery ${index + 2}`} className="aspect-[4/3] h-full w-full object-cover transition duration-500 hover:scale-[1.04]" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function PhotoCountBadge({ current, total }: { current: number; total: number }) {
  return (
    <span className="absolute bottom-3 right-3 inline-flex items-center rounded-full bg-stone-950/75 px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur">
      {current} / {total}
    </span>
  );
}

function ActionBar({ venue, shareLabel, onShare }: { venue: Venue; shareLabel: string; onShare: () => void }) {
  return (
    <section className="mt-6 flex flex-wrap gap-2 rounded-xl border bg-card p-2">
      <Button asChild>
        <a href={getGoogleMapsDirectionsUrl(venue)} target="_blank" rel="noreferrer">
          <Navigation className="mr-2 h-4 w-4" />
          Get directions
        </a>
      </Button>
      {venue.phone ? (
        <Button asChild variant="outline">
          <a href={`tel:${venue.phone}`}>
            <Phone className="mr-2 h-4 w-4" />
            Call
          </a>
        </Button>
      ) : (
        <Button type="button" variant="outline" disabled>
          <Phone className="mr-2 h-4 w-4" />
          Call
        </Button>
      )}
      <Button type="button" variant="outline" onClick={onShare}>
        <Share2 className="mr-2 h-4 w-4" />
        {shareLabel}
      </Button>
      <Button asChild variant="outline">
        <a href={`mailto:hello@sheesh.london?subject=${encodeURIComponent(`Venue report: ${venue.name}`)}`}>
          <Flag className="mr-2 h-4 w-4" />
          Report
        </a>
      </Button>
      {venue.website ? (
        <Button asChild variant="outline" className="ml-0 lg:ml-auto">
          <a href={venue.website} target="_blank" rel="noreferrer">
            Website
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      ) : null}
    </section>
  );
}

function OverviewTab({ venue, amenities, similarVenues }: { venue: Venue; amenities: string[]; similarVenues: Venue[] }) {
  return (
    <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <article className="min-w-0 space-y-8">
        <section>
          <h2 className="text-2xl font-semibold">About</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-muted-foreground">{venue.description}</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Key details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailTile icon={<Clock className="h-4 w-4" />} label="Hours" value={formatCurrentStatus(getVenueCurrentStatus(venue))} />
            <DetailTile icon={<Star className="h-4 w-4" />} label="Rating" value={venue.rating ? `${venue.rating} / 5` : "Rating TBC"} />
            <DetailTile icon={<Sofa className="h-4 w-4" />} label="Seating" value={venue.outdoor ? "Outdoor seating" : venue.indoor ? "Indoor seating" : "Seating TBC"} />
            <DetailTile icon={<Utensils className="h-4 w-4" />} label="Food & drinks" value={formatFoodDrinks(venue)} />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Amenities</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {amenities.length ? amenities.map((amenity) => <Badge key={amenity}>{amenity}</Badge>) : <p className="text-muted-foreground">Amenities TBC</p>}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold">Similar venues</h2>
          <SimilarVenueCarousel venues={similarVenues} />
        </section>
      </article>

      <aside className="min-w-0 space-y-4">
        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Opening hours</h2>
          <div className="mt-4 grid gap-2">
            {venue.openingHours.length ? (
              venue.openingHours.map((item) => (
                <div key={item.day} className="grid grid-cols-[96px_1fr] gap-3 text-sm">
                  <span className="font-medium">{item.day}</span>
                  <span className="text-muted-foreground">
                    {item.open} - {item.close}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Opening hours TBC</p>
            )}
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Location</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            {venue.address}
            <br />
            {venue.area}
            <br />
            London {venue.postcode}
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border">
            <VenueMap
              venues={[venue]}
              selectedVenueId={venue.id}
              className="h-72 rounded-none border-0 [&_.leaflet-container]:!min-h-72 md:[&_.leaflet-container]:!min-h-72"
            />
          </div>
        </section>

        <section className="rounded-xl border bg-card p-4">
          <h2 className="font-semibold">Venue information</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <VenueVerificationBadge status={venue.verificationStatus} />
            {venue.lastVerifiedAt ? <span className="text-sm text-muted-foreground">Checked {formatVerifiedDate(venue.lastVerifiedAt)}</span> : null}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">Venue details can change. Check directly before travelling or booking.</p>
          {venue.sourceNotes ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{venue.sourceNotes}</p> : null}
        </section>
      </aside>
    </div>
  );
}

function DetailTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-3 font-semibold">{value}</p>
    </div>
  );
}

function CurrentStatusBadge({ status }: { status: ReturnType<typeof getVenueCurrentStatus> }) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold",
        status === "open" && "bg-clay-accent/10 text-clay-accent",
        status === "closed" && "bg-red-950/10 text-red-700",
        status === "unknown" && "bg-foreground/5 text-muted-foreground",
      )}
    >
      {formatCurrentStatus(status)}
    </span>
  );
}

function formatFoodDrinks(venue: Venue) {
  if (venue.food && venue.alcohol) {
    return "Food and alcohol";
  }

  if (venue.food) {
    return "Food available";
  }

  if (venue.alcohol) {
    return "Alcohol available";
  }

  return "Not listed";
}

function MenuTab({ venue }: { venue: Venue }) {
  const rows = [
    ["Shisha", venue.priceFrom ? `From £${venue.priceFrom}` : "Price TBC"],
    ["Price tier", formatPriceLevel(venue.priceLevel)],
    ["Food", venue.food ? "Available" : "Not listed"],
    ["Alcohol", venue.alcohol ? "Available" : "Not listed"],
  ];

  return (
    <section className="max-w-3xl">
      <h2 className="text-2xl font-semibold">Menu & prices</h2>
      <div className="mt-5 overflow-hidden rounded-xl border bg-card">
        {rows.map(([label, value], index) => (
          <div key={label} className={cn("grid grid-cols-[1fr_auto] gap-4 p-4 text-sm", index > 0 && "border-t")}>
            <span className="font-medium">{label}</span>
            <span className="text-muted-foreground">{value}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Detailed flavour and food menus will appear here once verified source data is available.</p>
    </section>
  );
}

function ReviewsTab({ venue }: { venue: Venue }) {
  return (
    <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <Card className="h-fit p-5">
        <p className="text-sm text-muted-foreground">Average rating</p>
        <div className="mt-3 flex items-end gap-2">
          <span className="text-5xl font-semibold">{venue.rating ?? "-"}</span>
          <span className="pb-1 text-muted-foreground">/ 5</span>
        </div>
        <div className="mt-5 space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="grid grid-cols-[24px_1fr] items-center gap-3 text-sm text-muted-foreground">
              <span>{rating}</span>
              <div className="h-2 rounded-full bg-secondary">
                <div className="h-full rounded-full bg-clay-accent" style={{ width: venue.rating && Math.round(venue.rating) === rating ? "72%" : "8%" }} />
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="flex min-h-64 flex-col items-start justify-center p-6">
        <h2 className="text-2xl font-semibold">Reviews coming soon</h2>
        <p className="mt-3 max-w-lg text-muted-foreground">We have the rating summary, but individual user reviews are not connected yet.</p>
        <Button className="mt-5" disabled>
          Write a review
        </Button>
      </Card>
    </section>
  );
}

function PhotosTab({ venue, images, onOpenImage }: { venue: Venue; images: string[]; onOpenImage: (index: number) => void }) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-2">
        <Camera className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">Photos</h2>
      </div>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border bg-card text-left"
            onClick={() => onOpenImage(index)}
          >
            <img
              src={image}
              alt={`${venue.name} photo ${index + 1}`}
              className="w-full object-cover transition duration-500 hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>
    </section>
  );
}

function PhotoLightbox({
  venue,
  images,
  activeIndex,
  onChange,
  onClose,
}: {
  venue: Venue;
  images: string[];
  activeIndex: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const activeImage = images[activeIndex] ?? images[0] ?? getVenueImage(venue);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft" && hasMultipleImages) {
        onChange(getPreviousImageIndex(activeIndex, images.length));
      }

      if (event.key === "ArrowRight" && hasMultipleImages) {
        onChange(getNextImageIndex(activeIndex, images.length));
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [activeIndex, hasMultipleImages, images.length, onChange, onClose]);

  return (
    <div className="fixed inset-0 z-[1500] bg-stone-950/90 p-3 text-background sm:p-6" role="dialog" aria-modal="true" aria-label={`${venue.name} photo viewer`}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close photo viewer" onClick={onClose} />
      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{venue.name}</p>
            <p className="text-xs text-background/65">
              Photo {activeIndex + 1} of {images.length}
            </p>
          </div>
          <Button type="button" variant="secondary" size="icon" className="bg-background/10 text-background hover:bg-background/20" aria-label="Close photo viewer" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center">
          {hasMultipleImages ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute left-0 z-20 bg-background/10 text-background hover:bg-background/20 sm:left-3"
              aria-label="Previous photo"
              onClick={() => onChange(getPreviousImageIndex(activeIndex, images.length))}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : null}

          <img
            src={activeImage}
            alt={`${venue.name} expanded photo ${activeIndex + 1}`}
            className="max-h-full max-w-full rounded-xl object-contain shadow-2xl shadow-stone-950/40"
          />

          {hasMultipleImages ? (
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-0 z-20 bg-background/10 text-background hover:bg-background/20 sm:right-3"
              aria-label="Next photo"
              onClick={() => onChange(getNextImageIndex(activeIndex, images.length))}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={`${image}-thumb-${index}`}
                type="button"
                className={cn(
                  "h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition",
                  index === activeIndex ? "border-background" : "border-background/20 opacity-65 hover:opacity-100",
                )}
                aria-label={`Open photo ${index + 1}`}
                onClick={() => onChange(index)}
              >
                <img src={image} alt={`${venue.name} thumbnail ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function getPreviousImageIndex(activeIndex: number, imageCount: number) {
  return (activeIndex - 1 + imageCount) % imageCount;
}

function getNextImageIndex(activeIndex: number, imageCount: number) {
  return (activeIndex + 1) % imageCount;
}

function SimilarVenueCarousel({ venues }: { venues: Venue[] }) {
  if (!venues.length) {
    return <p className="mt-4 text-muted-foreground">Similar venues will appear as the venue catalogue grows.</p>;
  }

  return (
    <div className="mt-4 flex max-w-full gap-4 overflow-x-auto pb-2">
      {venues.map((venue) => (
        <Link key={venue.id} reloadDocument to={`/venues/${venue.slug}`} className="w-64 shrink-0 overflow-hidden rounded-xl border bg-card transition hover:border-clay-accent/40">
          <img src={getVenueImage(venue)} alt={`${venue.name} interior`} className="h-32 w-full object-cover" />
          <div className="p-3">
            <h3 className="truncate font-semibold">{venue.name}</h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">{venue.area}</p>
            <div className="mt-2">
              <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
            </div>
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
  if (status === "open") {
    return "Open now";
  }

  if (status === "closed") {
    return "Closed now";
  }

  return "Hours TBC";
}
