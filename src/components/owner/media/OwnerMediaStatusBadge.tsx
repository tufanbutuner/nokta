import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VenueMediaReviewStatus } from "@/types/venueMedia";

const STATUS_LABEL: Record<VenueMediaReviewStatus, string> = {
  pending: "Awaiting review",
  approved: "Visible publicly",
  rejected: "Rejected",
};

const STATUS_CLASS: Record<VenueMediaReviewStatus, string> = {
  pending: "border-nokta-warn-line bg-nokta-warn-tint text-nokta-warn-ink",
  approved: "border-nokta-ok-line bg-nokta-ok-tint text-nokta-ok-ink",
  rejected: "border-nokta-bad-line bg-nokta-bad-tint text-nokta-bad-ink",
};

export function OwnerMediaStatusBadge({ status }: { status: VenueMediaReviewStatus }) {
  return <Badge variant="outline" className={cn(STATUS_CLASS[status])}>{STATUS_LABEL[status]}</Badge>;
}
