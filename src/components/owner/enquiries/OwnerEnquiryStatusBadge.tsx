import { Badge } from "@/components/ui/badge";
import { formatAdminVenueEnquiryStatus } from "@/lib/venueEnquiryLabels";
import { cn } from "@/lib/utils";
import type { VenueEnquiryStatus } from "@/types/venueEnquiries";

const STATUS_CLASSES: Record<VenueEnquiryStatus, string> = {
  new: "border-violet-200 bg-violet-50 text-violet-900",
  contacted: "border-blue-200 bg-blue-50 text-blue-900",
  responded: "border-amber-200 bg-amber-50 text-amber-900",
  converted: "border-emerald-200 bg-emerald-50 text-emerald-900",
  closed: "border-border bg-muted text-muted-foreground",
  spam: "border-red-200 bg-red-50 text-red-900",
};

export function OwnerEnquiryStatusBadge({ status }: { status: VenueEnquiryStatus }) {
  return <Badge variant="outline" className={cn("capitalize", STATUS_CLASSES[status])}>{formatAdminVenueEnquiryStatus(status)}</Badge>;
}
