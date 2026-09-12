import { Button } from "@/components/ui/button";
import { brandConfig } from "@/config/brand";
import { useVenueReviews } from "@/hooks/useVenueReviews";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { getGoogleMapsDirectionsUrl } from "@/lib/directions";
import { getVenueOpeningBoundary } from "@/lib/openingHours";
import { cn } from "@/lib/utils";
import { formatVenuePrimaryCategory } from "@/lib/venueCategoryLabels";
import { VIBE_OPTIONS } from "@/lib/venueFilters";
import { getVenueRatingSummary } from "@/services/reviewService";
import type { Venue } from "@/types/venue";
import { ExternalLink, Flag, Heart, MoreHorizontal, Navigation, Phone, Share2, Star } from "lucide-react";
import { useState } from "react";
import { getVenueAnalyticsProperties } from "./venueDetailAnalytics";

const VIBE_LABELS = new Map(VIBE_OPTIONS.map((option) => [option.value, option.label]));

/** Venue name with the category as a label beside it, rather than as a chip row below. */
export function VenueTitleRow({ venue }: { venue: Venue }) {
  // Centred, not baseline-aligned: the label is a bordered pill, so matching text
  // baselines hangs its box below the name rather than beside it.
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <h1 className="min-w-0 text-[28px] font-semibold leading-[1.05] tracking-[-0.6px] text-nokta-ink sm:text-[34px]">{venue.name}</h1>
      <span className="inline-flex h-6 shrink-0 items-center rounded-md border border-nokta-border bg-white px-2.5 text-[12.5px] font-semibold text-nokta-ink-subtle">{formatVenuePrimaryCategory(venue.primaryCategory)}</span>
    </div>
  );
}

/**
 * One meta line carrying every header fact once: live opening boundary, rating, area and
 * distance, then the two strongest vibes alongside the category. Anything unknown is
 * omitted rather than rendered as a placeholder.
 */
export function VenueHeaderMeta({ venue, distanceLabel }: { venue: Venue; distanceLabel: string | null }) {
  const { reviews } = useVenueReviews(venue.id);
  const summary = getVenueRatingSummary(reviews);
  const displayRating = summary.averageRating ?? venue.rating ?? null;
  const boundary = getVenueOpeningBoundary(venue);
  const areaLabel = [venue.area, distanceLabel].filter(Boolean).join(", ");
  const descriptorLabel = [formatVenuePrimaryCategory(venue.primaryCategory), ...venue.vibes.slice(0, 2).map((vibe) => VIBE_LABELS.get(vibe) ?? vibe)].join(" · ");
  const segments = [areaLabel, descriptorLabel].filter(Boolean);

  return (
    <div className="mt-[11px] flex flex-wrap items-center gap-[9px] text-[14.5px] text-nokta-ink-subtle">
      {boundary.label ? <OpeningStatusPill status={boundary.status} label={boundary.label} /> : null}
      {displayRating ? (
        <span className="inline-flex items-center gap-1.5 font-medium text-nokta-ink">
          <Star className="h-3.5 w-3.5 fill-nokta-ink text-nokta-ink" />
          {displayRating}
        </span>
      ) : null}
      {segments.map((segment, index) => (
        <span key={segment} className="inline-flex items-center gap-[9px]">
          {index > 0 || displayRating || boundary.label ? (
            <span className="text-[oklch(0.6_0.02_42)]" aria-hidden="true">
              ·
            </span>
          ) : null}
          {segment}
        </span>
      ))}
    </div>
  );
}

/**
 * Directions and website always work, so they read as buttons; the rest are icon buttons.
 * A control whose datum is missing is removed rather than shown disabled.
 */
export function ActionBar({ venue, shareLabel, onShare, onToggleSave, isSaved }: { venue: Venue; shareLabel: string; onShare: () => void; onToggleSave?: () => void; isSaved?: boolean }) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const analyticsProperties = getVenueAnalyticsProperties(venue);
  const iconButtonClass = "inline-flex h-11 w-11 items-center justify-center rounded-lg border border-nokta-border bg-white text-nokta-ink-subtle transition-colors hover:bg-nokta-hover";

  return (
    <div className="mt-[18px] flex flex-wrap items-center gap-2">
      <Button asChild className="h-11 rounded-lg bg-nokta-ink px-[15px] text-sm font-medium text-white hover:bg-nokta-ink/90">
        <a href={getGoogleMapsDirectionsUrl(venue)} target="_blank" rel="noreferrer noopener" onClick={() => trackVenueAction(venue, "directions_clicked", "venue_directions_clicked", analyticsProperties)}>
          <Navigation className="mr-2 h-[15px] w-[15px]" />
          Directions
        </a>
      </Button>

      {venue.website ? (
        <Button asChild variant="outline" className="h-11 rounded-lg border-nokta-border bg-white px-[15px] text-sm font-medium text-nokta-ink hover:bg-nokta-hover">
          <a href={venue.website} target="_blank" rel="noreferrer noopener" onClick={() => trackVenueAction(venue, "website_clicked", "venue_website_clicked", analyticsProperties)}>
            <ExternalLink className="mr-2 h-[15px] w-[15px]" />
            {formatWebsiteDomain(venue.website)}
          </a>
        </Button>
      ) : null}

      {onToggleSave ? (
        <button type="button" className={iconButtonClass} aria-label={isSaved ? "Remove from saved" : "Save venue"} aria-pressed={isSaved} onClick={onToggleSave}>
          <Heart className={cn("h-4 w-4", isSaved && "fill-clay-accent text-clay-accent")} />
        </button>
      ) : null}

      <button type="button" className={iconButtonClass} aria-label={shareLabel} onClick={onShare}>
        <Share2 className="h-4 w-4" />
      </button>

      <div className="relative">
        <button type="button" className={iconButtonClass} aria-label="More actions" aria-expanded={isMoreOpen} onClick={() => setIsMoreOpen((open) => !open)}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {isMoreOpen ? (
          <>
            <button type="button" className="fixed inset-0 z-10 cursor-default" aria-label="Close menu" onClick={() => setIsMoreOpen(false)} />
            <div className="absolute right-0 z-20 mt-2 min-w-[200px] overflow-hidden rounded-lg border border-nokta-border bg-white py-1 shadow-[0_8px_24px_rgba(28,25,23,0.12)]">
              {venue.phone ? (
                <a href={`tel:${venue.phone}`} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-nokta-ink hover:bg-nokta-hover" onClick={() => setIsMoreOpen(false)}>
                  <Phone className="h-4 w-4 text-nokta-ink-muted" />
                  {venue.phone}
                </a>
              ) : null}
              {venue.instagram ? (
                <a href={venue.instagram} target="_blank" rel="noreferrer noopener" className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-nokta-ink hover:bg-nokta-hover" onClick={() => { trackVenueAction(venue, "instagram_clicked", "venue_instagram_clicked", analyticsProperties); setIsMoreOpen(false); }}>
                  <ExternalLink className="h-4 w-4 text-nokta-ink-muted" />
                  Instagram
                </a>
              ) : null}
              <a href={`mailto:${brandConfig.supportEmail}?subject=${encodeURIComponent(`Venue report: ${venue.name}`)}`} className="flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium text-nokta-ink hover:bg-nokta-hover" onClick={() => setIsMoreOpen(false)}>
                <Flag className="h-4 w-4 text-nokta-ink-muted" />
                Report a problem
              </a>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function OpeningStatusPill({ status, label }: { status: "open" | "closed" | "unknown"; label: string }) {
  const isOpen = status === "open";

  return (
    <span className={cn("inline-flex h-[26px] items-center gap-1.5 rounded-md pl-2 pr-[9px] text-[13px] font-semibold", isOpen ? "bg-[oklch(0.95_0.05_150)] text-[oklch(0.34_0.09_150)]" : "bg-stone-100 text-nokta-ink-subtle")}>
      <span className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-[oklch(0.55_0.14_150)]" : "bg-nokta-ink-muted")} />
      {label}
    </span>
  );
}

/** The bare domain reads better on the button than the full URL. */
function formatWebsiteDomain(website: string): string {
  try {
    return new URL(website).hostname.replace(/^www\./, "");
  } catch {
    return website.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
  }
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
