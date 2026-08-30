import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VenueMediaReviewStatus } from "@/types/venueMedia";

const STATUS_LABEL: Record<VenueMediaReviewStatus, string> = {
  pending: "Awaiting review",
  approved: "Visible publicly",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<VenueMediaReviewStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-900",
  rejected: "border-red-200 bg-red-50 text-red-900",
};

export function OwnerMediaStatusBadge({ status }: { status: VenueMediaReviewStatus }) {
  return <Badge variant="outline" className={cn(STATUS_CLASS[status])}>{STATUS_LABEL[status]}</Badge>;
}
