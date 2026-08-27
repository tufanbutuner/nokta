import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatVenueEnquiryStatus, formatVenueEnquiryType } from "@/lib/venueEnquiryLabels";
import type { Venue } from "@/types/venue";
import type { VenueEnquiry } from "@/types/venueEnquiries";

export function MyVenueEnquiries({ enquiries, venuesById }: { enquiries: VenueEnquiry[]; venuesById: Record<string, Venue | undefined> }) {
  if (!enquiries.length) return <p className="text-sm text-muted-foreground">No enquiries sent yet.</p>;

  return (
    <div className="space-y-3">
      {enquiries.slice(0, 5).map((enquiry) => {
        const venue = venuesById[enquiry.venueId];
        return (
          <div key={enquiry.id} className="rounded-lg border bg-background/60 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <Link to={venue ? `/venues/${venue.slug}` : "#"} className="font-medium hover:text-clay-accent">{venue?.name ?? enquiry.venueId}</Link>
                <p className="mt-1 text-sm text-muted-foreground">{formatVenueEnquiryType(enquiry.enquiryType)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{formatPartyDate(enquiry)}</p>
              </div>
              <Badge variant="outline">{formatVenueEnquiryStatus(enquiry.status)}</Badge>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatPartyDate(enquiry: VenueEnquiry) {
  return [
    enquiry.partySize ? `${enquiry.partySize} people` : null,
    enquiry.preferredDate,
    enquiry.preferredTime,
    `Submitted ${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(enquiry.createdAt))}`,
  ].filter(Boolean).join(" · ");
}
