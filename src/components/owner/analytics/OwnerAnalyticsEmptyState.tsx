import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Venue } from "@/types/venue";

export function OwnerAnalyticsEmptyState({ venue }: { venue: Venue }) {
  return (
    <section className="rounded-xl border bg-card p-8 text-center">
      <h2 className="text-xl font-semibold">No analytics yet</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        Once customers start viewing your venue on Nokta, profile views, booking requests and customer actions will appear here.
      </p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild><Link to={`/owner/venues/${venue.slug}/profile`}>Complete setup</Link></Button>
        <Button asChild variant="outline"><Link to={`/venues/${venue.slug}`}>View public profile</Link></Button>
      </div>
    </section>
  );
}
