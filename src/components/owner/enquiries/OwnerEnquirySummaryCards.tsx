import type { VenueEnquiry, VenueEnquiryStatus } from "@/types/venueEnquiries";

const STATUSES: VenueEnquiryStatus[] = ["new", "contacted", "responded", "converted", "closed", "spam"];

export function OwnerEnquirySummaryCards({ enquiries }: { enquiries: VenueEnquiry[] }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
      <Metric label="Total" value={enquiries.length} />
      {STATUSES.map((status) => <Metric key={status} label={status.replace("-", " ")} value={enquiries.filter((enquiry) => enquiry.status === status).length} />)}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-2xl border bg-nokta-surface p-4 border-nokta-border"><p className="text-sm capitalize text-nokta-ink-muted">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}
