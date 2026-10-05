import { PageContainer } from "@/components/layout/PageContainer";
import { VenueOffersSection } from "@/components/offers/VenueOffersSection";
import { PageMeta } from "@/components/seo/PageMeta";
import { ErrorState } from "@/components/state/ErrorState";
import { LoadingState } from "@/components/state/LoadingState";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { MenuTab, OverviewTab, ReviewsTab, VenueHoursLocationCard } from "@/components/venues/detail/VenueDetailSections";
import { ActionBar, VenueHeaderMeta, VenueTitleRow } from "@/components/venues/detail/VenueHeaderSections";
import { BookingSidebarCard, MobileBookingCta } from "@/components/venues/detail/VenueBookingCta";
import { PhotoGallery, PhotoLightbox } from "@/components/venues/detail/VenuePhotoGallery";
import { getVenueAnalyticsProperties } from "@/components/venues/detail/venueDetailAnalytics";
import { useAppLocation } from "@/context/AppLocationContext";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { useVenue } from "@/hooks/useVenue";
import { useVenueReviews } from "@/hooks/useVenueReviews";
import { useVenues } from "@/hooks/useVenues";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getCityByName } from "@/lib/cities";
import { formatDistanceMiles, getVenueDistanceMiles } from "@/lib/location";
import { getVenuePageMetadata } from "@/lib/pageMetadata";
import { cn } from "@/lib/utils";
import { getVenueImages } from "@/lib/venueImages";
import { getApprovedVenueMedia } from "@/services/ownerVenueMediaService";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

type VenueDetailTab = "overview" | "menu" | "reviews";

const VENUE_TABS: { label: string; value: VenueDetailTab }[] = [
  { label: "Overview", value: "overview" },
  { label: "Menu", value: "menu" },
  { label: "Reviews", value: "reviews" },
];

function parseTab(value: string | null): VenueDetailTab {
  return VENUE_TABS.some((tab) => tab.value === value) ? (value as VenueDetailTab) : "overview";
}

export function VenuePage() {
  const { slug } = useParams();
  const { addRecentlyViewed, isFavourite, toggleFavourite } = useVenuePreferences();
  const { venue, isLoading, error } = useVenue(slug);
  const { venues } = useVenues();
  const { userLocation } = useAppLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseTab(searchParams.get("tab"));
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
      <main className="bg-nokta-page-bg">
        <PageMeta title="Venue | nokta" description="View opening hours, features, address, reviews and verification details for a nokta venue." />
        <PageContainer className="py-7">
          {/* Reserve the hero strip and rail so the page does not jump once the venue lands. */}
          <div className="h-[240px] rounded-[14px] bg-nokta-track" />
          <div className="mt-6 flex flex-wrap items-start gap-x-[34px] gap-y-6">
            <div className="min-w-0 flex-[1_1_460px]">
              <LoadingState message="Loading venue..." />
            </div>
            <div className="flex-[1_1_320px]" />
          </div>
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

  const city = getCityByName(venue.city);
  const distanceLabel = userLocation ? formatDistanceMiles(getVenueDistanceMiles(venue, userLocation)).replace(" away", "") : null;
  const galleryImages = approvedMediaImages.length ? approvedMediaImages : getVenueImages(venue);
  // Same city first: matching on area or a shared vibe alone put a Chelsea venue under
  // "Similar in Jewellery Quarter", because "City Centre" exists in seven cities and almost
  // every venue shares the "casual" and "groups" vibes. Prefer the same area, then fall back
  // to the rest of the city.
  const similarVenues = venues
    .filter((candidate) => candidate.id !== venue.id && candidate.city === venue.city)
    .filter((candidate) => candidate.area === venue.area || candidate.vibes.some((vibe) => venue.vibes.includes(vibe)))
    .sort((a, b) => Number(b.area === venue.area) - Number(a.area === venue.area))
    .slice(0, 6);

  /** Tabs live in the URL so a tab is linkable and the back button works. */
  function selectTab(tab: VenueDetailTab) {
    setSearchParams((params) => {
      const next = new URLSearchParams(params);
      if (tab === "overview") next.delete("tab");
      else next.set("tab", tab);
      return next;
    });
  }

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
      <PageMeta {...getVenuePageMetadata(venue)} canonicalPath={`/venues/${venue.slug}`} imageUrl={galleryImages[0]} />

      <PageContainer className="pb-28 pt-3 lg:pb-16">
        <PhotoGallery venue={venue} images={galleryImages} onOpenImage={setActiveImageIndex} />

        <Breadcrumb className="mb-3.5 mt-4 text-[12.5px] text-nokta-ink-muted">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="font-normal text-clay-accent hover:text-clay-accent-hover">
                <Link to="/discover">
                  Discover
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {city?.isActive ? (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild className="font-normal text-clay-accent hover:text-clay-accent-hover">
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

        {/* One wrapping row: the rail sits alongside the whole main column, tabs included. */}
        <div className="flex flex-wrap items-start gap-x-[34px] gap-y-6">
          <div className="min-w-0 flex-[1_1_460px]">
            <VenueTitleRow venue={venue} />
            <VenueHeaderMeta venue={venue} distanceLabel={distanceLabel} />
            <p className="mt-4 max-w-[580px] text-[15.5px] leading-[1.72] text-nokta-ink-subtle">{venue.description}</p>
            <ActionBar venue={venue} shareLabel={shareLabel} onShare={shareVenue} isSaved={isFavourite(venue.id)} onToggleSave={() => void toggleFavourite(venue.id)} />

            <VenueOffersSection venue={venue} />

            <div className="mt-7 flex gap-[22px] overflow-x-auto overflow-y-hidden scrollbar-none border-b border-nokta-border pb-[11px]">
              {VENUE_TABS.map((tab) => (
                <TabButton key={tab.value} label={tab.label} count={tab.value === "reviews" ? <ReviewCount venueId={venue.id} /> : null} isActive={activeTab === tab.value} onClick={() => selectTab(tab.value)} />
              ))}
            </div>

            <div className="mt-[18px]">
              {activeTab === "overview" ? <OverviewTab venue={venue} similarVenues={similarVenues} onOpenMenu={() => selectTab("menu")} /> : null}
              {activeTab === "menu" ? <MenuTab venue={venue} /> : null}
              {activeTab === "reviews" ? <ReviewsTab venue={venue} /> : null}
            </div>
          </div>

          <aside className="grid w-full flex-[1_1_320px] gap-3 lg:sticky lg:top-4">
            {/* Below lg the sticky bottom bar carries the CTA, so the rail card would duplicate it. */}
            <BookingSidebarCard venue={venue} className="hidden lg:block" />
            <VenueHoursLocationCard venue={venue} />
          </aside>
        </div>
      </PageContainer>

      <MobileBookingCta venue={venue} />

      {activeImageIndex !== null ? <PhotoLightbox venue={venue} images={galleryImages} activeIndex={activeImageIndex} onChange={setActiveImageIndex} onClose={() => setActiveImageIndex(null)} /> : null}
    </main>
  );
}

function TabButton({ label, count, isActive, onClick }: { label: string; count: React.ReactNode; isActive: boolean; onClick: () => void }) {
  return (
    <button type="button" className={cn("-mb-[12px] shrink-0 border-b-2 pb-[11px] text-sm font-semibold transition-colors", isActive ? "border-nokta-ink text-nokta-ink" : "border-transparent text-nokta-ink-muted hover:text-nokta-ink")} onClick={onClick}>
      {label}
      {count}
    </button>
  );
}

/** Rendered even at zero, so an empty Reviews tab is honest about being empty. */
function ReviewCount({ venueId }: { venueId: string }) {
  const { reviews, isLoading } = useVenueReviews(venueId);
  if (isLoading) return null;
  return <span className="ml-1.5 font-medium text-[oklch(0.6_0.02_42)]">{reviews.length}</span>;
}
