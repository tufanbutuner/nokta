import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { FavouriteButton } from "@/components/venues/FavouriteButton";
import { RecommendationReasonList } from "@/components/recommendations/RecommendationReasonList";
import { VenuePrice } from "@/components/venues/VenuePrice";
import type { RecommendedVenue } from "@/types/recommendations";

export function RecommendationResultCard({ recommendation, rank }: { recommendation: RecommendedVenue; rank: number }) {
  const { venue } = recommendation;

  return (
    <Card className="overflow-hidden">
      <div className="grid gap-0 md:grid-cols-[240px_1fr]">
        <Link reloadDocument to={`/venues/${venue.slug}`} className="block bg-muted">
          <img src={venue.images[0]} alt={`${venue.name} interior`} className="aspect-[4/3] h-full w-full object-cover" />
        </Link>
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">#{rank} recommendation</p>
              <h3 className="mt-2 text-2xl font-semibold">{venue.name}</h3>
              <p className="text-muted-foreground">{venue.area}</p>
            </div>
            <FavouriteButton venueId={venue.id} venueName={venue.name} className="h-10 w-10 border" />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <strong className="text-lg text-foreground">{recommendation.matchPercentage}% match</strong>
            <VenuePrice level={venue.priceLevel} from={venue.priceFrom} />
            {venue.rating ? <span>★ {venue.rating}</span> : null}
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Why this matches</p>
            <RecommendationReasonList reasons={recommendation.reasons.length ? recommendation.reasons : ["A balanced match for your preferences"]} />
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
