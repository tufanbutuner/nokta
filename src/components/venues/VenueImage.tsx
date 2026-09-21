import { useState } from "react";
import { cn } from "@/lib/utils";
import { getVenueImage, getVenueInitials, getVenuePlaceholderGradient } from "@/lib/venueImages";
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
}: {
  venue: Venue;
  src?: string;
  alt?: string;
  className?: string;
  monogramClassName?: string;
}) {
  const image = src ?? getVenueImage(venue);
  const [hasFailed, setHasFailed] = useState(false);

  if (!image || hasFailed) {
    return <VenuePlaceholder venue={venue} className={className} monogramClassName={monogramClassName} />;
  }

  return <img src={image} alt={alt ?? `${venue.name} photo`} loading="lazy" className={className} onError={() => setHasFailed(true)} />;
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
