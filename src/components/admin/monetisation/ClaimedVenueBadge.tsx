import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ClaimedVenueBadge({ claimed, variant = "badge" }: { claimed: boolean; variant?: "badge" | "dot" }) {
  if (variant === "dot") {
    return (
      <span
        className={cn("block h-[7px] w-[7px] rounded-full", claimed ? "bg-forest-400" : "bg-clay-300")}
        aria-label={claimed ? "Claimed" : "Unclaimed"}
      />
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("w-fit rounded px-2 py-0.5 text-[10px] font-semibold", claimed ? "border-forest-400/20 bg-forest-50 text-forest-400" : "border-clay-100 bg-clay-100 text-[#8a7e72]")}
    >
      {claimed ? "Claimed" : "Unclaimed"}
    </Badge>
  );
}
