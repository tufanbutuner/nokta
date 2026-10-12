import { Badge } from "@/components/ui/badge";
import { formatAdminVenueEnquiryStatus } from "@/lib/venueEnquiryLabels";
import { cn } from "@/lib/utils";
import type { VenueEnquiryStatus } from "@/types/venueEnquiries";

const STATUS_CLASSES: Record<VenueEnquiryStatus, string> = {
  new: "border-nokta-info-line bg-nokta-info-tint text-nokta-info-ink",
  contacted: "border-nokta-info-line bg-nokta-info-tint text-nokta-info-ink",
  responded: "border-nokta-warn-line bg-nokta-warn-tint text-nokta-warn-ink",
  converted: "border-nokta-ok-line bg-nokta-ok-tint text-nokta-ok-ink",
  closed: "border-border bg-nokta-track text-nokta-ink-muted",
  spam: "border-nokta-bad-line bg-nokta-bad-tint text-nokta-bad-ink",
};

export function OwnerEnquiryStatusBadge({ status }: { status: VenueEnquiryStatus }) {
  return <Badge variant="outline" className={cn("capitalize", STATUS_CLASSES[status])}>{formatAdminVenueEnquiryStatus(status)}</Badge>;
}
