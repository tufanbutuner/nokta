import { Button } from "@/components/ui/button";
import { getProfileCompletenessScore } from "@/lib/profileCompleteness";
import { Link } from "react-router-dom";
import type { VenueSubscription } from "@/types/subscriptions";
import type { Venue } from "@/types/venue";

export function ProfileCompletenessCard({ venue, subscription }: { venue: Venue; subscription: VenueSubscription | null }) {
  const score = getProfileCompletenessScore(venue, subscription);

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold">Profile completeness</h2>
          <p className="mt-1 text-sm text-muted-foreground">A stronger profile may help customers trust and book your venue.</p>
        </div>
        <p className="text-3xl font-semibold">{score}%</p>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-clay-accent" style={{ width: `${score}%` }} />
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm"><Link to={`/owner/venues/${venue.slug}/photos`}>Upload photos</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to={`/owner/venues/${venue.slug}/profile`}>Update details</Link></Button>
        <Button asChild variant="outline" size="sm"><Link to={`/owner/venues/${venue.slug}/bookings`}>Configure availability</Link></Button>
      </div>
    </section>
  );
}
