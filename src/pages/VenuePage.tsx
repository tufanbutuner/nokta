import { PageContainer } from "@/components/layout/PageContainer";
import { VenueMap } from "@/components/map/VenueMap";
import { VenueOffersSection } from "@/components/offers/VenueOffersSection";
import { ReviewSection } from "@/components/reviews/ReviewSection";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Sheet, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { VenueBadge } from "@/components/venues/VenueBadge";
import { VenueVerificationBadge } from "@/components/venues/VenueVerificationBadge";
import { useAppLocation } from "@/context/AppLocationContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenue } from "@/hooks/useVenue";
import { useVenueReviews } from "@/hooks/useVenueReviews";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getCityByName } from "@/lib/cities";
import { getGoogleMapsDirectionsUrl } from "@/lib/directions";
import { formatDistanceMiles, getVenueDistanceMiles } from "@/lib/location";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { getBookingTimeOptions } from "@/lib/bookingTimeOptions";
import { cn } from "@/lib/utils";
import { formatPriceLevel } from "@/lib/venueFilters";
import { formatVenuePrimaryCategory, formatVenueSecondaryCategory } from "@/lib/venueCategoryLabels";
import { getVenueImage, getVenueImages } from "@/lib/venueImages";
import { getVenueRatingSummary } from "@/services/reviewService";
import { getApprovedVenueMedia } from "@/services/ownerVenueMediaService";
import { getVenueBookingAvailability } from "@/services/bookingAvailabilityService";
import { brandConfig } from "@/config/brand";
import type { VenueBookingAvailability } from "@/types/bookingAvailability";
import type { Venue } from "@/types/venue";
import { ArrowLeft, Camera, ChevronLeft, ChevronRight, Clock, ExternalLink, Flag, MapPin, Navigation, Phone, Share2, Sofa, Star, Utensils, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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
  const [approvedMediaImages, setApprovedMediaImages] = useState<string[]>([]);

  useEffect(() => {
    if (venue) {
      void addRecentlyViewed(venue.id);
      trackEvent("venue_viewed", getVenueAnalyticsProperties(venue));
      trackVenueAnalyticsEvent({
        venueId: venue.id,
        eventName: "venue_profile_viewed",
        city: venue.city,
        area: venue.area,
        sourceSurface: "venue_page",
      });
    }
  }, [addRecentlyViewed, venue]);

  useEffect(() => {
    if (!venue) {
      setApprovedMediaImages([]);
      return;
    }

    let cancelled = false;
    getApprovedVenueMedia(venue.id)
      .then((media) => {
        if (!cancelled) setApprovedMediaImages(media.map((item) => item.url));
      })
      .catch(() => {
        if (!cancelled) setApprovedMediaImages([]);
      });
    return () => {
      cancelled = true;
    };
  }, [venue]);

  if (isLoading) {
    return (
      <main>
        <PageMeta title="Venue | nokta" description="View opening hours, features, address, reviews and verification details for a nokta venue." />
        <PageContainer className="py-20">
          <LoadingState message="Loading venue..." />
        </PageContainer>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <PageMeta title="Venue unavailable | nokta" description="We could not load this venue right now." />
        <PageContainer className="py-20">
          <ErrorState message={error} />
        </PageContainer>
      </main>
    );
  }

  if (!venue) {
    return (
      <PageContainer className="py-20">
        <PageMeta title="Venue not found | nokta" description="This nokta venue could not be found." />
        <h1 className="text-3xl font-semibold">Venue not found</h1>
        <Button asChild className="mt-6">
          <Link reloadDocument to="/discover">
            Back to discover
          </Link>
        </Button>
      </PageContainer>
    );
  }

  const currentStatus = getVenueCurrentStatus(venue);
  const city = getCityByName(venue.city);
  const distanceLabel = userLocation ? formatDistanceMiles(getVenueDistanceMiles(venue, userLocation)).replace(" away", "") : null;
  const amenities = [venue.food && "Food", venue.outdoor && "Outdoor seating", venue.indoor && "Indoor seating", venue.alcohol && "Alcohol", venue.openLate && "Open late"].filter((amenity): amenity is string => Boolean(amenity));
  const galleryImages = approvedMediaImages.length ? approvedMediaImages : getVenueImages(venue);
  const similarVenues = venues.filter((candidate) => candidate.id !== venue.id && (candidate.area === venue.area || candidate.vibes.some((vibe) => venue.vibes.includes(vibe)))).slice(0, 6);

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
    <main className="bg-nokta-page-bg text-nokta-ink">
      <PageMeta title={`${venue.name} in ${venue.city} | nokta`} description={`View category, opening hours, features, address, reviews and booking details for ${venue.name} in ${venue.city}.`} canonicalPath={`/venues/${venue.slug}`} imageUrl={galleryImages[0] ?? getVenueImage(venue)} />
      <PhotoGallery venue={venue} images={galleryImages} onOpenImage={setActiveImageIndex} />

      <PageContainer className="pb-24 pt-4 sm:py-7 lg:pb-7">
        <Breadcrumb className="mb-4 hidden text-[13px] text-nokta-ink-muted sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="font-normal text-nokta-ink-muted hover:text-nokta-ink">
                <Link reloadDocument to="/discover">
                  Discover
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {city?.isActive ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="font-normal text-nokta-ink-muted hover:text-nokta-ink">
                    <Link reloadDocument to={`/cities/${city.slug}`}>
                      {city.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            ) : null}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-nokta-ink">{venue.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-8">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-start gap-2">
                  <h1 className="min-w-0 text-wrap font-body text-[24px] font-semibold leading-[1.08] text-nokta-ink sm:text-4xl">
                    {venue.name}
                  </h1>
                  {venue.isClaimed ? <ClaimedVenueBadge size="md" className="mt-1.5 shrink-0 sm:mt-2" /> : null}
                </div>
                <VenueBadgeRow venue={venue} />
              </div>
              <CurrentStatusBadge status={currentStatus} className="shrink-0" />
            </div>
            <VenueHeaderMeta venue={venue} distanceLabel={distanceLabel} />
            <p className="mt-5 max-w-xl text-base leading-7 text-nokta-ink-subtle">{venue.description}</p>
            <ActionBar venue={venue} shareLabel={shareLabel} onShare={shareVenue} />
          </div>

          <BookingSidebarCard venue={venue} className="hidden lg:block" />
        </section>

        <VenueOffersSection venue={venue} />

        <div className="sticky top-0 z-20 -mx-4 mt-6 border-b border-nokta-border bg-nokta-page-bg/95 px-4 backdrop-blur sm:static sm:mx-0 sm:mt-7 sm:bg-transparent sm:px-0 sm:backdrop-blur-none">
          <div className="flex gap-5 overflow-x-auto pb-3">
            {VENUE_TABS.map((tab) => (
              <button key={tab.value} type="button" className={cn("relative h-9 shrink-0 text-sm font-semibold text-nokta-ink-muted transition-colors hover:text-nokta-ink", activeTab === tab.value && "text-nokta-ink after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-nokta-ink")} onClick={() => setActiveTab(tab.value)}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 sm:mt-8">
          {activeTab === "overview" ? <OverviewTab venue={venue} amenities={amenities} similarVenues={similarVenues} /> : null}
          {activeTab === "menu" ? <MenuTab venue={venue} /> : null}
          {activeTab === "reviews" ? <ReviewsTab venue={venue} /> : null}
          {activeTab === "photos" ? <PhotosTab venue={venue} images={galleryImages} onOpenImage={setActiveImageIndex} /> : null}
        </div>
      </PageContainer>

      <MobileBookingCta venue={venue} />

      {activeImageIndex !== null ? <PhotoLightbox venue={venue} images={galleryImages} activeIndex={activeImageIndex} onChange={setActiveImageIndex} onClose={() => setActiveImageIndex(null)} /> : null}
    </main>
  );
}

function VenueBadgeRow({ venue }: { venue: Venue }) {
  const mobileBadges = [formatVenuePrimaryCategory(venue.primaryCategory), ...venue.vibes.slice(0, 1)];
  const hiddenMobileCount = Math.max(0, venue.secondaryCategories.slice(0, 3).length + venue.vibes.slice(1, 5).length);

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2 sm:hidden">
        {mobileBadges.map((label) => (
          <VenueBadge key={label} label={label} />
        ))}
        {hiddenMobileCount ? <Badge variant="outline" className="rounded-full border-transparent bg-nokta-surface px-2.5 py-1 text-[12px] font-semibold text-nokta-ink-muted">+{hiddenMobileCount}</Badge> : null}
      </div>
      <div className="mt-3 hidden flex-wrap gap-2 sm:flex">
        <VenueBadge label={formatVenuePrimaryCategory(venue.primaryCategory)} />
        {venue.secondaryCategories.slice(0, 3).map((category) => (
          <VenueBadge key={category} label={formatVenueSecondaryCategory(category)} />
        ))}
        {venue.vibes.slice(0, 5).map((vibe) => (
          <VenueBadge key={vibe} label={vibe} />
        ))}
      </div>
    </>
  );
}

function VenueHeaderMeta({ venue, distanceLabel }: { venue: Venue; distanceLabel: string | null }) {
  const { reviews } = useVenueReviews(venue.id);
  const summary = getVenueRatingSummary(reviews);
  const displayRating = summary.averageRating ?? venue.rating ?? null;
  const reviewLabel = summary.reviewCount > 0 ? `${summary.reviewCount} user review${summary.reviewCount === 1 ? "" : "s"}` : displayRating ? "Rating estimate" : "No user reviews yet";
  const priceLabel = venue.priceFrom ? `From £${venue.priceFrom}` : "Price TBC";

  return (
    <>
      <div className="mt-3 grid gap-1.5 text-[13.5px] leading-[1.4] sm:hidden">
        <div className="flex items-center gap-2 font-medium text-nokta-ink">
          {displayRating ? (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-3.5 w-3.5 fill-nokta-ink text-nokta-ink" />
              {displayRating}
            </span>
          ) : null}
          <span className="text-nokta-ink-muted">·</span>
          <span>{reviewLabel}</span>
        </div>
        <div className="flex items-center gap-1.5 text-nokta-ink-muted">
          <MapPin className="h-3.5 w-3.5" />
          {venue.area}
          {distanceLabel ? ` · ${distanceLabel}` : null}
        </div>
        <div className="text-nokta-ink-muted">{priceLabel}</div>
      </div>

      <div className="mt-3 hidden flex-wrap items-center gap-x-3 gap-y-2 text-sm text-nokta-ink-muted sm:flex">
        {displayRating ? (
          <>
            <span className="inline-flex items-center gap-1.5 font-medium text-nokta-ink">
              <Star className="h-3.5 w-3.5 fill-nokta-ink text-nokta-ink" />
              {displayRating}
            </span>
            <span className="text-nokta-ink-muted" aria-hidden="true">
              •
            </span>
          </>
        ) : null}
        <span>{reviewLabel}</span>
        <span className="text-nokta-ink-muted" aria-hidden="true">
          •
        </span>
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {venue.area}
          {distanceLabel ? ` • ${distanceLabel}` : null}
        </span>
        <span className="text-nokta-ink-muted" aria-hidden="true">
          •
        </span>
        <span className="whitespace-nowrap">{priceLabel}</span>
      </div>
    </>
  );
}

function PlanYourVisitCard({ venue }: { venue: Venue }) {
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

function PhotoGallery({ venue, images, onOpenImage }: { venue: Venue; images: string[]; onOpenImage: (index: number) => void }) {
  const primaryImage = images[0] ?? getVenueImage(venue);
  const galleryImages = images.length ? images : [primaryImage];
  const galleryCount = galleryImages.length;
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const activeImage = galleryImages[activeGalleryIndex] ?? primaryImage;
  const hasMultipleImages = galleryImages.length > 1;

  return (
    <section className="relative bg-nokta-surface">
      <Button asChild variant="secondary" size="icon" className="absolute left-3 top-3 z-20 h-10 w-10 rounded-full bg-stone-950/55 text-white backdrop-blur hover:bg-stone-950/70 sm:hidden" aria-label="Back to discover">
        <Link to="/discover">
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </Button>
      <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="absolute right-3 top-3 z-20 h-10 w-10 bg-stone-950/55 text-white backdrop-blur hover:bg-stone-950/70 sm:hidden [&_svg.fill-foreground]:fill-white" />
      <button type="button" className="block h-[220px] w-full overflow-hidden text-left sm:h-[340px]" onClick={() => onOpenImage(activeGalleryIndex)}>
        <img src={activeImage} alt={`${venue.name} gallery ${activeGalleryIndex + 1}`} className="h-full w-full object-cover transition duration-700 hover:scale-[1.015]" />
      </button>
      {hasMultipleImages ? (
        <>
          <Button type="button" variant="secondary" size="icon" className="absolute left-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-nokta-ink shadow-lg backdrop-blur hover:bg-white" aria-label="Previous photo" onClick={() => setActiveGalleryIndex((index) => getPreviousImageIndex(index, galleryImages.length))}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button type="button" variant="secondary" size="icon" className="absolute right-3 top-1/2 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 text-nokta-ink shadow-lg backdrop-blur hover:bg-white" aria-label="Next photo" onClick={() => setActiveGalleryIndex((index) => getNextImageIndex(index, galleryImages.length))}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      ) : null}
      <PhotoCountBadge current={activeGalleryIndex + 1} total={galleryCount} />
    </section>
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
  const analyticsProperties = getVenueAnalyticsProperties(venue);
  const actionButtonClass = "h-10 w-full rounded-lg border-nokta-border bg-white px-3.5 text-sm font-medium text-nokta-ink-subtle hover:bg-nokta-surface-hover hover:text-nokta-ink sm:w-auto";

  return (
    <>
      <section className="mt-5 flex gap-2 sm:hidden">
        <MobileActionButton primary as="a" href={getGoogleMapsDirectionsUrl(venue)} label="Directions" onClick={() => trackVenueAction(venue, "directions_clicked", "venue_directions_clicked", analyticsProperties)} icon={<Navigation className="h-5 w-5" />} />
        <MobileActionButton as={venue.phone ? "a" : "button"} href={venue.phone ? `tel:${venue.phone}` : undefined} label="Call" disabled={!venue.phone} icon={<Phone className="h-5 w-5" />} />
        <MobileActionButton as="button" label={shareLabel} onClick={onShare} icon={<Share2 className="h-5 w-5" />} />
        <MobileActionButton as="a" href={`mailto:${brandConfig.supportEmail}?subject=${encodeURIComponent(`Venue report: ${venue.name}`)}`} label="Report" icon={<Flag className="h-5 w-5" />} />
        <MobileActionButton as={venue.website ? "a" : "button"} href={venue.website ?? undefined} target={venue.website ? "_blank" : undefined} rel={venue.website ? "noreferrer" : undefined} label="Website" disabled={!venue.website} onClick={venue.website ? () => trackVenueAction(venue, "website_clicked", "venue_website_clicked", analyticsProperties) : undefined} icon={<ExternalLink className="h-5 w-5" />} />
      </section>
      <section className="mt-5 hidden flex-wrap gap-2 sm:mt-6 sm:flex">
      <Button asChild className="col-span-2 h-10 rounded-lg bg-nokta-ink px-3.5 text-sm font-medium text-white hover:bg-nokta-ink/90 sm:col-span-1">
        <a href={getGoogleMapsDirectionsUrl(venue)} target="_blank" rel="noreferrer" onClick={() => trackVenueAction(venue, "directions_clicked", "venue_directions_clicked", analyticsProperties)}>
          <Navigation className="mr-2 h-4 w-4" />
          Get directions
        </a>
      </Button>
      {venue.phone ? (
        <Button asChild variant="outline" className={actionButtonClass}>
          <a href={`tel:${venue.phone}`}>
            <Phone className="mr-2 h-4 w-4" />
            Call
          </a>
        </Button>
      ) : (
        <Button type="button" variant="outline" className={actionButtonClass} disabled>
          <Phone className="mr-2 h-4 w-4" />
          Call
        </Button>
      )}
      <Button type="button" variant="outline" className={actionButtonClass} onClick={onShare}>
        <Share2 className="mr-2 h-4 w-4" />
        {shareLabel}
      </Button>
      <Button asChild variant="outline" className={actionButtonClass}>
        <a href={`mailto:${brandConfig.supportEmail}?subject=${encodeURIComponent(`Venue report: ${venue.name}`)}`}>
          <Flag className="mr-2 h-4 w-4" />
          Report
        </a>
      </Button>
      {venue.website ? (
        <Button asChild variant="outline" className={cn(actionButtonClass, "font-semibold text-nokta-ink")}>
          <a href={venue.website} target="_blank" rel="noreferrer" onClick={() => trackVenueAction(venue, "website_clicked", "venue_website_clicked", analyticsProperties)}>
            Website
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      ) : null}
      {venue.instagram ? (
        <Button asChild variant="outline" className={cn(actionButtonClass, "font-semibold text-nokta-ink")}>
          <a href={venue.instagram} target="_blank" rel="noreferrer" onClick={() => trackVenueAction(venue, "instagram_clicked", "venue_instagram_clicked", analyticsProperties)}>
            Instagram
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
      ) : null}
      </section>
    </>
  );
}

function MobileActionButton({ as, href, target, rel, label, icon, primary = false, disabled = false, onClick }: { as: "a" | "button"; href?: string; target?: string; rel?: string; label: string; icon: React.ReactNode; primary?: boolean; disabled?: boolean; onClick?: () => void }) {
  const buttonClass = cn("h-12 w-full rounded-full", primary ? "bg-nokta-ink text-white hover:bg-nokta-ink/90" : "border-nokta-border bg-white text-nokta-ink hover:bg-nokta-surface-hover");

  return (
    <div className="min-w-0 flex-1 text-center">
      <Button asChild={as === "a" && !disabled} type={as === "button" ? "button" : undefined} variant={primary ? "default" : "outline"} size="icon" className={buttonClass} disabled={disabled} onClick={onClick}>
        {as === "a" && !disabled ? (
          <a href={href} target={target} rel={rel}>
            {icon}
          </a>
        ) : (
          <span>{icon}</span>
        )}
      </Button>
      <span className="mt-1 block truncate text-[11px] font-medium leading-4 text-nokta-ink-muted">{label}</span>
    </div>
  );
}

function BookingSidebarCard({ venue, className, compact = false }: { venue: Venue; className?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [date, setDate] = useState(getTodayDateValue());
  const [time, setTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [availability, setAvailability] = useState<VenueBookingAvailability | null>(null);
  const timeOptions = availability && date ? getBookingTimeOptions({ availability, selectedDate: date }) : [];
  const hasAvailabilityForDate = Boolean(availability && date && timeOptions.length);

  useEffect(() => {
    let cancelled = false;
    getVenueBookingAvailability(venue.id)
      .then((nextAvailability) => {
        if (!cancelled) setAvailability(nextAvailability);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      });

    return () => {
      cancelled = true;
    };
  }, [venue.id]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (availability && !time) return;
    trackBookingCta(venue);
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (time) params.set("time", time);
    if (partySize) params.set("partySize", String(partySize));
    const query = params.toString();
    navigate(`/venues/${venue.slug}/request-booking${query ? `?${query}` : ""}`);
  }

  return (
    <form className={cn("rounded-2xl border border-nokta-border bg-white p-4 shadow-sm shadow-stone-950/5 sm:p-5", compact && "border-0 p-0 shadow-none sm:p-0", className)} onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3">
        {!compact ? <h2 className="text-[15px] font-semibold text-nokta-ink">Request a booking</h2> : null}
        <FavouriteButton venueId={venue.id} venueName={venue.name} venue={venue} className="hidden h-10 w-10 shrink-0 border lg:inline-flex" />
      </div>
      <div className={cn("mt-4 grid gap-3", compact && "mt-0")}>
        <div className="grid gap-2 min-[380px]:grid-cols-2">
          <Input
            type="date"
            value={date}
            aria-label="Booking date"
            className="h-11 rounded-lg border-nokta-border-input bg-white text-base text-nokta-ink sm:text-sm"
            onChange={(event) => {
              setDate(event.target.value);
              setTime("");
            }}
          />
          <Select
            value={time}
            aria-label="Booking time"
            className="h-11 rounded-lg border-nokta-border-input bg-white text-base text-nokta-ink sm:text-sm"
            placeholder={availability && date ? timeOptions.length ? "Time" : "No times" : "Choose date"}
            options={timeOptions.map((option) => ({ label: option, value: option }))}
            disabled={!hasAvailabilityForDate}
            onValueChange={setTime}
          />
        </div>
        <Input type="number" min={1} max={100} value={partySize} aria-label="Party size" placeholder="Party size" className="h-11 rounded-lg border-nokta-border-input bg-white text-base text-nokta-ink sm:text-sm" onChange={(event) => setPartySize(event.target.value ? Number(event.target.value) : 0)} />
      </div>
      <div className="mt-4 grid gap-2">
        <Button type="submit" className="h-11 rounded-lg bg-nokta-accent text-white hover:bg-nokta-accent-dark" disabled={Boolean(availability && (!date || !time))}>Request booking</Button>
        <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white text-nokta-ink hover:bg-nokta-surface-hover" onClick={() => trackEnquiryCta(venue)}>
          <Link to={`/venues/${venue.slug}/enquire`}>Send enquiry</Link>
        </Button>
      </div>
      <p className="mt-3 text-xs leading-5 text-nokta-ink-muted">Requests are confirmed once the venue accepts.</p>
    </form>
  );
}

function MobileBookingCta({ venue }: { venue: Venue }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed inset-x-0 bottom-0 z-[1200] border-t border-nokta-border bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-12px_28px_rgba(28,25,23,0.08)] lg:hidden">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-nokta-ink">{venue.priceFrom ? `From £${venue.priceFrom}` : "Price TBC"}</p>
          <p className="truncate text-xs text-nokta-ink-muted">Request a booking</p>
        </div>
        <Button type="button" className="h-11 shrink-0 rounded-lg bg-nokta-accent px-5 text-white hover:bg-nokta-accent-dark" onClick={() => setOpen(true)}>
          Request booking
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen} side="bottom">
        <SheetHeader>
          <div>
            <SheetTitle>Request a booking</SheetTitle>
            <p className="mt-1 text-sm text-muted-foreground">{venue.name}</p>
          </div>
          <SheetClose onClick={() => setOpen(false)} />
        </SheetHeader>
        <BookingSidebarCard venue={venue} compact />
      </Sheet>
    </div>
  );
}

function getVenueAnalyticsProperties(venue: Venue) {
  return {
    venueId: venue.id,
    venueSlug: venue.slug,
    venueName: venue.name,
    primaryCategory: venue.primaryCategory,
    area: venue.area,
  };
}

function trackEnquiryCta(venue: Venue) {
  trackEvent("enquiry_cta_clicked", getVenueAnalyticsProperties(venue));
  trackVenueAnalyticsEvent({
    venueId: venue.id,
    eventName: "venue_enquiry_cta_clicked",
    city: venue.city,
    area: venue.area,
    sourceSurface: "venue_page",
  });
}

function trackBookingCta(venue: Venue) {
  trackEvent("booking_request_started", { ...getVenueAnalyticsProperties(venue), city: venue.city, sourceSurface: "venue_page" });
  trackVenueAnalyticsEvent({
    venueId: venue.id,
    eventName: "venue_booking_cta_clicked",
    city: venue.city,
    area: venue.area,
    sourceSurface: "venue_page",
  });
}

function trackVenueAction(venue: Venue, productEvent: "directions_clicked" | "website_clicked" | "instagram_clicked", venueEvent: "venue_directions_clicked" | "venue_website_clicked" | "venue_instagram_clicked", properties: ReturnType<typeof getVenueAnalyticsProperties>) {
  trackEvent(productEvent, properties);
  trackVenueAnalyticsEvent({
    venueId: venue.id,
    eventName: venueEvent,
    city: venue.city,
    area: venue.area,
    sourceSurface: "venue_page",
  });
}

function getTodayDateValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function OverviewTab({ venue, amenities, similarVenues }: { venue: Venue; amenities: string[]; similarVenues: Venue[] }) {
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

function DetailTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
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

function CurrentStatusBadge({ status, className }: { status: ReturnType<typeof getVenueCurrentStatus>; className?: string }) {
  return <span className={cn("inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold", status === "open" && "bg-emerald-50 text-emerald-700", status === "closed" && "bg-red-50 text-red-700", status === "unknown" && "bg-stone-100 text-nokta-ink-muted", className)}>{formatCurrentStatus(status)}</span>;
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

function ClaimVenueBanner({ venue }: { venue: Venue }) {
  if (venue.isClaimed) {
    return null;
  }

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

function MenuTab({ venue }: { venue: Venue }) {
  const rows = [
    ["Shisha", venue.priceFrom ? `From £${venue.priceFrom}` : "Price TBC"],
    ["Price tier", formatPriceLevel(venue.priceLevel)],
    ["Food", venue.food ? "Available" : "Not listed"],
    ["Alcohol", venue.alcohol ? "Available" : "Not listed"],
  ];

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
      <p className="mt-4 text-sm text-nokta-ink-muted">Detailed flavour and food menus will appear here once verified source data is available.</p>
    </section>
  );
}

function ReviewsTab({ venue }: { venue: Venue }) {
  return <ReviewSection venue={venue} />;
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
          <button key={`${image}-${index}`} type="button" className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-xl border bg-card text-left" onClick={() => onOpenImage(index)}>
            <img src={image} alt={`${venue.name} photo ${index + 1}`} className="w-full object-cover transition duration-500 hover:scale-[1.03]" />
          </button>
        ))}
      </div>
    </section>
  );
}

function PhotoLightbox({ venue, images, activeIndex, onChange, onClose }: { venue: Venue; images: string[]; activeIndex: number; onChange: (index: number) => void; onClose: () => void }) {
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
            <Button type="button" variant="secondary" size="icon" className="absolute left-0 z-20 bg-background/10 text-background hover:bg-background/20 sm:left-3" aria-label="Previous photo" onClick={() => onChange(getPreviousImageIndex(activeIndex, images.length))}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
          ) : null}

          <img src={activeImage} alt={`${venue.name} expanded photo ${activeIndex + 1}`} className="max-h-full max-w-full rounded-xl object-contain shadow-2xl shadow-stone-950/40" />

          {hasMultipleImages ? (
            <Button type="button" variant="secondary" size="icon" className="absolute right-0 z-20 bg-background/10 text-background hover:bg-background/20 sm:right-3" aria-label="Next photo" onClick={() => onChange(getNextImageIndex(activeIndex, images.length))}>
              <ChevronRight className="h-6 w-6" />
            </Button>
          ) : null}
        </div>

        {hasMultipleImages ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button key={`${image}-thumb-${index}`} type="button" className={cn("h-16 w-24 shrink-0 overflow-hidden rounded-lg border transition", index === activeIndex ? "border-background" : "border-background/20 opacity-65 hover:opacity-100")} aria-label={`Open photo ${index + 1}`} onClick={() => onChange(index)}>
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
    <div className="-mx-4 mt-4 flex max-w-[calc(100%+2rem)] gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:max-w-full sm:px-0">
      {venues.map((venue) => (
        <Link key={venue.id} reloadDocument to={`/venues/${venue.slug}`} className="group w-[220px] shrink-0 rounded-2xl border border-nokta-border bg-white p-2 shadow-none transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-stone-950/5">
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
  if (status === "open") {
    return "Open now";
  }

  if (status === "closed") {
    return "Closed now";
  }

  return "Hours TBC";
}
