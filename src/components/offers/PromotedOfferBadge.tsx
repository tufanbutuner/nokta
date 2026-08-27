import { Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromotedOfferBadgeProps {
  compact?: boolean;
  className?: string;
}

export function PromotedOfferBadge({ compact = false, className }: PromotedOfferBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-950 shadow-sm",
        className,
      )}
      title="This is a promoted venue offer."
      aria-label="Promoted offer"
    >
      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{compact ? "Offer" : "Promoted offer"}</span>
    </div>
  );
}
