import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ClaimedVenueBadge({ claimed, variant = "badge" }: { claimed: boolean; variant?: "badge" | "dot" }) {
  if (variant === "dot") {
    return (
      <span
        className={cn("block h-[7px] w-[7px] rounded-full", claimed ? "bg-nokta-ok-solid" : "bg-nokta-warn-solid")}
        aria-label={claimed ? "Claimed" : "Unclaimed"}
      />
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn("w-fit rounded px-2 py-0.5 text-[11px] font-semibold", claimed ? "border-nokta-ok-line/20 bg-nokta-ok-tint text-nokta-ok-ink" : "border-nokta-border bg-nokta-track text-nokta-ink-muted")}
    >
      {claimed ? "Claimed" : "Unclaimed"}
    </Badge>
  );
}
