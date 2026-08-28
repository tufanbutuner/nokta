import { Button } from "@/components/ui/button";
import { OwnerEnquiryStatusBadge } from "@/components/owner/enquiries/OwnerEnquiryStatusBadge";
import { OwnerEnquiryTypeBadge } from "@/components/owner/enquiries/OwnerEnquiryTypeBadge";
import { formatPartyDate } from "@/components/owner/enquiries/OwnerEnquiryCard";
import type { VenueEnquiry } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

export function OwnerEnquiryDetailsDialog({ enquiry, venue, onClose }: { enquiry: VenueEnquiry; venue?: Venue; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[1700] grid place-items-center bg-stone-950/45 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{enquiry.customerName}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{venue?.name ?? enquiry.venueId}</p>
          </div>
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2"><OwnerEnquiryStatusBadge status={enquiry.status} /><OwnerEnquiryTypeBadge type={enquiry.enquiryType} /></div>
        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <Detail label="Email" value={enquiry.customerEmail} />
          <Detail label="Phone" value={enquiry.customerPhone ?? "Not provided"} />
          <Detail label="Party/date" value={formatPartyDate(enquiry)} />
          <Detail label="Submitted" value={new Date(enquiry.createdAt).toLocaleString("en-GB")} />
          <Detail label="Venue response" value={enquiry.venueResponse ?? "Not added"} />
          <Detail label="Owner notes" value={enquiry.ownerNotes ?? "Not added"} />
        </dl>
        <div className="mt-5 rounded-lg border bg-background/60 p-4 text-sm">
          <p className="font-medium">Message</p>
          <p className="mt-2 whitespace-pre-line text-muted-foreground">{enquiry.message ?? "No message provided."}</p>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>;
}
