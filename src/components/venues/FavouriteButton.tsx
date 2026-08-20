import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVenuePreferences } from "@/context/VenuePreferencesContext";
import { cn } from "@/lib/utils";

interface FavouriteButtonProps {
  venueId: string;
  venueName: string;
  className?: string;
}

export function FavouriteButton({ venueId, venueName, className }: FavouriteButtonProps) {
  const { isFavourite, toggleFavourite } = useVenuePreferences();
  const saved = isFavourite(venueId);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn("rounded-full bg-card/85 text-foreground backdrop-blur hover:bg-card", className)}
      aria-label={saved ? `Remove ${venueName} from saved venues` : `Save ${venueName}`}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavourite(venueId);
      }}
    >
      <Heart className={cn("h-4 w-4", saved && "fill-foreground")} />
    </Button>
  );
}
