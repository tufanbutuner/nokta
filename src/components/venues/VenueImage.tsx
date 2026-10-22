import { useState } from "react";
import { cn } from "@/lib/utils";
import { getVenueImage, getVenueInitials, getVenuePlaceholderGradient, getVenueThumbnailUrl } from "@/lib/venueImages";
import type { Venue } from "@/types/venue";

/**
 * Venue photo with a branded fallback. We only ever show a real photo of the venue, so a
 * venue without one (or whose photo fails to load) gets a monogram tile instead of a stock
 * lounge shot that would misrepresent the place.
 */
export function VenueImage({
  venue,
  src,
  alt,
  className,
  monogramClassName,
  thumbnailSize,
  priority = false,
}: {
  venue: Venue;
  src?: string;
  alt?: string;
  className?: string;
  monogramClassName?: string;
  thumbnailSize?: number;
  priority?: boolean;
}) {
  const image = src ?? getVenueImage(venue);
  const [hasFailed, setHasFailed] = useState(false);
  const [useOriginal, setUseOriginal] = useState(false);

  if (!image || hasFailed) {
    return <VenuePlaceholder venue={venue} className={className} monogramClassName={monogramClassName} />;
  }

  const thumbnail = thumbnailSize ? getVenueThumbnailUrl(image, thumbnailSize) : image;
  return <img
    src={useOriginal ? image : thumbnail}
    alt={alt ?? `${venue.name} photo`}
    loading={priority ? "eager" : "lazy"}
    fetchPriority={priority ? "high" : undefined}
    width={thumbnailSize}
    height={thumbnailSize}
    className={className}
    onError={() => thumbnail !== image && !useOriginal ? setUseOriginal(true) : setHasFailed(true)}
  />;
}

export function VenuePlaceholder({ venue, className, monogramClassName }: { venue: Venue; className?: string; monogramClassName?: string }) {
  return (
    <div
      role="img"
      aria-label={`${venue.name} has no photos yet`}
      className={cn("flex items-center justify-center bg-gradient-to-br", getVenuePlaceholderGradient(venue), className)}
    >
      <span className={cn("select-none font-semibold uppercase tracking-[0.08em] text-white/90", monogramClassName ?? "text-[clamp(18px,14cqi,34px)]")}>
        {getVenueInitials(venue)}
      </span>
    </div>
  );
}
