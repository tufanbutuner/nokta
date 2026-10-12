import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { formatVenueEnquiryStatus, formatVenueEnquiryType } from "@/lib/venueEnquiryLabels";
import type { Venue } from "@/types/venue";
import type { VenueEnquiry } from "@/types/venueEnquiries";

export function MyVenueEnquiries({ enquiries, venuesById }: { enquiries: VenueEnquiry[]; venuesById: Record<string, Venue | undefined> }) {
  if (!enquiries.length) return <p className="text-sm text-muted-foreground">No enquiries sent yet.</p>;

  return (
    <ul className="divide-y divide-nokta-divider">
      {enquiries.slice(0, 5).map((enquiry) => {
        const venue = venuesById[enquiry.venueId];
        return (
          <li key={enquiry.id} className="flex items-start justify-between gap-4 py-4 first:pt-0 last:pb-0">
            <div className="min-w-0">
              {venue ? (
                <Link to={`/venues/${venue.slug}`} className="font-semibold text-nokta-ink underline-offset-4 hover:underline">{venue.name}</Link>
              ) : (
                <p className="font-semibold text-nokta-ink">Venue no longer listed</p>
              )}
              <p className="mt-1 text-sm text-nokta-ink-muted">{formatVenueEnquiryType(enquiry.enquiryType)}</p>
              <p className="mt-0.5 text-sm text-nokta-ink-muted">{formatPartyDate(enquiry)}</p>
            </div>
            <Badge variant="outline" className="shrink-0">{formatVenueEnquiryStatus(enquiry.status)}</Badge>
          </li>
        );
      })}
    </ul>
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
