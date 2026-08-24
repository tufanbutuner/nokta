import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/types/reviews";

const STATUS_LABELS: Record<ReviewStatus, string> = {
  published: "Published",
  hidden: "Hidden",
  flagged: "Flagged",
  deleted: "Deleted",
};

const STATUS_CLASSES: Record<ReviewStatus, string> = {
  published: "border-emerald-200 bg-emerald-50 text-emerald-800",
  hidden: "border-stone-200 bg-stone-100 text-stone-700",
  flagged: "border-amber-200 bg-amber-50 text-amber-800",
  deleted: "border-red-200 bg-red-50 text-red-800",
};

export function ReviewStatusBadge({ status, className }: { status: ReviewStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function getReviewStatusLabel(status: ReviewStatus) {
  return STATUS_LABELS[status];
}
