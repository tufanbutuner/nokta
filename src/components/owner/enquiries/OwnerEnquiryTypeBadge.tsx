import { Badge } from "@/components/ui/badge";
import { formatVenueEnquiryType } from "@/lib/venueEnquiryLabels";
import type { VenueEnquiryType } from "@/types/venueEnquiries";

export function OwnerEnquiryTypeBadge({ type }: { type: VenueEnquiryType }) {
  return <Badge variant="secondary">{formatVenueEnquiryType(type)}</Badge>;
}
