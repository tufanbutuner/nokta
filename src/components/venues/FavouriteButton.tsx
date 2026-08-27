import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { trackEvent, trackVenueAnalyticsEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import type { Venue } from "@/types/venue";

interface FavouriteButtonProps {
  venueId: string;
  venueName: string;
  venue?: Venue;
  className?: string;
}

export function FavouriteButton({ venueId, venueName, venue, className }: FavouriteButtonProps) {
  const { isFavourite, isLoading, toggleFavourite } = useVenuePreferences();
  const saved = isFavourite(venueId);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn("rounded-full bg-card/85 text-foreground backdrop-blur hover:bg-card", className)}
      aria-label={saved ? `Remove ${venueName} from saved venues` : `Save ${venueName}`}
      disabled={isLoading}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        trackEvent(saved ? "venue_unsaved" : "venue_saved", getFavouriteAnalyticsProperties(venueId, venueName, venue));
        trackVenueAnalyticsEvent({
          venueId,
          eventName: saved ? "venue_unsaved" : "venue_saved",
          city: venue?.city,
          area: venue?.area,
          sourceSurface: "venue_page",
        });
        void toggleFavourite(venueId);
      }}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-foreground")} />
    </Button>
  );
}

function getFavouriteAnalyticsProperties(venueId: string, venueName: string, venue?: Venue) {
  return {
    venueId,
    venueSlug: venue?.slug,
    venueName,
    area: venue?.area,
  };
}
