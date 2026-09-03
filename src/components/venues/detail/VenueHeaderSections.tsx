import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClaimedVenueBadge } from "@/components/venues/ClaimedVenueBadge";
import { VenueBadge } from "@/components/venues/VenueBadge";
import { brandConfig } from "@/config/brand";
import { getGoogleMapsDirectionsUrl } from "@/lib/directions";
import { getVenueCurrentStatus } from "@/lib/openingHours";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { formatVenuePrimaryCategory, formatVenueSecondaryCategory } from "@/lib/venueCategoryLabels";
import { getVenueRatingSummary } from "@/services/reviewService";
import { useVenueReviews } from "@/hooks/useVenueReviews";
import type { Venue } from "@/types/venue";
import { ExternalLink, Flag, MapPin, Navigation, Phone, Share2, Star } from "lucide-react";
import type { ReactNode } from "react";
import { getVenueAnalyticsProperties } from "./venueDetailAnalytics";

export function VenueTitleRow({ venue, currentStatus }: { venue: Venue; currentStatus: ReturnType<typeof getVenueCurrentStatus> }) {
  return (
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
  );
}

export function VenueHeaderMeta({ venue, distanceLabel }: { venue: Venue; distanceLabel: string | null }) {
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

export function ActionBar({ venue, shareLabel, onShare }: { venue: Venue; shareLabel: string; onShare: () => void }) {
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

export function CurrentStatusBadge({ status, className }: { status: ReturnType<typeof getVenueCurrentStatus>; className?: string }) {
  return <span className={cn("inline-flex h-7 items-center rounded-full px-3 text-xs font-semibold", status === "open" && "bg-emerald-50 text-emerald-700", status === "closed" && "bg-red-50 text-red-700", status === "unknown" && "bg-stone-100 text-nokta-ink-muted", className)}>{formatCurrentStatus(status)}</span>;
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

function MobileActionButton({ as, href, target, rel, label, icon, primary = false, disabled = false, onClick }: { as: "a" | "button"; href?: string; target?: string; rel?: string; label: string; icon: ReactNode; primary?: boolean; disabled?: boolean; onClick?: () => void }) {
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

function formatCurrentStatus(status: ReturnType<typeof getVenueCurrentStatus>) {
  if (status === "open") return "Open now";
  if (status === "closed") return "Closed now";
  return "Hours TBC";
}
