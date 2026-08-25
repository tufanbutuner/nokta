import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VenueSuggestionStatus } from "@/types/venueSuggestions";

const STATUS_LABELS: Record<VenueSuggestionStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  converted: "Converted",
};

const STATUS_CLASSES: Record<VenueSuggestionStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-800",
  rejected: "border-red-200 bg-red-50 text-red-800",
  converted: "border-stone-200 bg-stone-100 text-stone-700",
};

export function SuggestionStatusBadge({ status, className }: { status: VenueSuggestionStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(STATUS_CLASSES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
