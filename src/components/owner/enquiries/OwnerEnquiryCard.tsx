import { OwnerEnquiryActions } from "@/components/owner/enquiries/OwnerEnquiryActions";
import { OwnerEnquiryStatusBadge } from "@/components/owner/enquiries/OwnerEnquiryStatusBadge";
import { OwnerEnquiryTypeBadge } from "@/components/owner/enquiries/OwnerEnquiryTypeBadge";
import type { VenueEnquiry, VenueEnquiryStatus } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

export function OwnerEnquiryCard({ enquiry, venue, onView, onStatus, onNotes }: { enquiry: VenueEnquiry; venue?: Venue; onView: () => void; onStatus: (status: VenueEnquiryStatus) => void; onNotes: () => void }) {
  return (
    <article className="rounded-xl border bg-card p-4 lg:hidden">
      <div className="flex flex-wrap gap-2"><OwnerEnquiryStatusBadge status={enquiry.status} /><OwnerEnquiryTypeBadge type={enquiry.enquiryType} /></div>
      <button className="mt-3 text-left text-lg font-semibold" onClick={onView}>{enquiry.customerName}</button>
      <p className="mt-1 text-sm text-muted-foreground">{venue?.name}</p>
      <p className="mt-2 text-sm text-muted-foreground">{formatPartyDate(enquiry)}</p>
      <div className="mt-4"><OwnerEnquiryActions enquiry={enquiry} onStatus={onStatus} onNotes={onNotes} /></div>
    </article>
  );
}

export function formatPartyDate(enquiry: VenueEnquiry) {
  return [enquiry.partySize ? `${enquiry.partySize} people` : null, enquiry.preferredDate, enquiry.preferredTime].filter(Boolean).join(" · ") || "Flexible";
}
