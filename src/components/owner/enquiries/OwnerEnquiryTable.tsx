import { Button } from "@/components/ui/button";
import { OwnerEnquiryActions } from "@/components/owner/enquiries/OwnerEnquiryActions";
import { OwnerEnquiryCard } from "@/components/owner/enquiries/OwnerEnquiryCard";
import { OwnerEnquiryStatusBadge } from "@/components/owner/enquiries/OwnerEnquiryStatusBadge";
import { OwnerEnquiryTypeBadge } from "@/components/owner/enquiries/OwnerEnquiryTypeBadge";
import { formatPartyDate } from "@/components/owner/enquiries/OwnerEnquiryCard";
import type { VenueEnquiry, VenueEnquiryStatus } from "@/types/venueEnquiries";
import type { Venue } from "@/types/venue";

export function OwnerEnquiryTable({ enquiries, venuesById, onView, onStatus, onNotes }: { enquiries: VenueEnquiry[]; venuesById: Record<string, Venue | undefined>; onView: (enquiry: VenueEnquiry) => void; onStatus: (enquiry: VenueEnquiry, status: VenueEnquiryStatus) => void; onNotes: (enquiry: VenueEnquiry) => void }) {
  if (!enquiries.length) return <div className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">No enquiries match these filters.</div>;

  return (
    <>
      <div className="grid gap-3 lg:hidden">{enquiries.map((enquiry) => <OwnerEnquiryCard key={enquiry.id} enquiry={enquiry} venue={venuesById[enquiry.venueId]} onView={() => onView(enquiry)} onStatus={(status) => onStatus(enquiry, status)} onNotes={() => onNotes(enquiry)} />)}</div>
      <div className="hidden overflow-hidden rounded-xl border bg-card lg:block"><div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Venue</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Party/date</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Submitted</th><th className="w-16 px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y">{enquiries.map((enquiry) => { const venue = venuesById[enquiry.venueId]; return <tr key={enquiry.id}><td className="px-4 py-4"><button className="font-medium hover:text-clay-accent" onClick={() => onView(enquiry)}>{enquiry.customerName}</button><div className="mt-1 text-xs text-muted-foreground">{enquiry.customerEmail}</div>{enquiry.customerPhone ? <div className="mt-1 text-xs text-muted-foreground">{enquiry.customerPhone}</div> : null}</td><td className="px-4 py-4 text-muted-foreground">{venue?.name ?? enquiry.venueId}</td><td className="px-4 py-4"><OwnerEnquiryTypeBadge type={enquiry.enquiryType} /></td><td className="px-4 py-4 text-muted-foreground">{formatPartyDate(enquiry)}</td><td className="px-4 py-4"><OwnerEnquiryStatusBadge status={enquiry.status} /></td><td className="px-4 py-4 text-muted-foreground">{new Date(enquiry.createdAt).toLocaleDateString("en-GB")}</td><td className="px-4 py-4 text-right"><OwnerEnquiryActions compact enquiry={enquiry} onStatus={(status) => onStatus(enquiry, status)} onNotes={() => onNotes(enquiry)} /></td></tr>; })}</tbody></table></div></div>
    </>
  );
}
