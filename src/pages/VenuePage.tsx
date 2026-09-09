import { PageContainer } from "@/components/layout/PageContainer";
import { VenueOffersSection } from "@/components/offers/VenueOffersSection";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { MenuTab, OverviewTab, ReviewsTab } from "@/components/venues/detail/VenueDetailSections";
import { ActionBar, VenueHeaderMeta, VenueTitleRow } from "@/components/venues/detail/VenueHeaderSections";
import { BookingSidebarCard, MobileBookingCta } from "@/components/venues/detail/VenueBookingCta";
import { PhotoGallery, PhotoLightbox, PhotosTab } from "@/components/venues/detail/VenuePhotoGallery";
import { getVenueAnalyticsProperties } from "@/components/venues/detail/venueDetailAnalytics";
import { useAppLocation } from "@/context/AppLocationContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenue } from "@/hooks/useVenue";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getCityByName } from "@/lib/cities";
import { formatDistanceMiles, getVenueDistanceMiles } from "@/lib/location";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import { getVenueImage, getVenueImages } from "@/lib/venueImages";
import { getApprovedVenueMedia } from "@/services/ownerVenueMediaService";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

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
          <Link to="/discover">
            Back to discover
          </Link>
        </Button>
      </PageContainer>
    );
  }

  const currentStatus = getVenueCurrentStatus(venue);
  const city = getCityByName(venue.city);
  const distanceLabel = userLocation ? formatDistanceMiles(getVenueDistanceMiles(venue, userLocation)).replace(" away", "") : null;
  const amenities = [venue.food && "Food", venue.outdoor && "Outdoor seating", venue.indoor && "Indoor seating", venue.alcohol && "Alcohol", venue.halal && "Halal", venue.openLate && "Open late"].filter((amenity): amenity is string => Boolean(amenity));
  const galleryImages = approvedMediaImages.length ? approvedMediaImages : getVenueImages(venue);
  const similarVenues = venues.filter((candidate) => candidate.id !== venue.id && (candidate.area === venue.area || candidate.vibes.some((vibe) => venue.vibes.includes(vibe)))).slice(0, 6);

  async function shareVenue() {
    if (!venue) {
      return;
    }

    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ url });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setShareLabel("Copied");
      window.setTimeout(() => setShareLabel("Share"), 1800);
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
                <Link to="/discover">
                  Discover
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {city?.isActive ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="font-normal text-nokta-ink-muted hover:text-nokta-ink">
                    <Link to={`/cities/${city.slug}`}>
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
            <VenueTitleRow venue={venue} currentStatus={currentStatus} />
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
