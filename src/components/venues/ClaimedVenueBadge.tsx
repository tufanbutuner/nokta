import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClaimedVenueBadgeProps {
  compact?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ClaimedVenueBadge({ compact = false, size = "sm", className }: ClaimedVenueBadgeProps) {
  const sizeClasses =
    size === "md"
      ? {
          root: "gap-2 px-3 py-1.5 text-sm",
          iconWrap: "h-5 w-5",
          icon: "h-3.5 w-3.5",
        }
      : {
          root: "gap-1.5 px-2.5 py-1 text-xs",
          iconWrap: "h-4 w-4",
          icon: "h-3 w-3",
        };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-amber-300/70 bg-gradient-to-r from-amber-50 to-orange-50 font-semibold text-amber-950 shadow-sm",
        sizeClasses.root,
        className,
      )}
      title="This profile is managed or confirmed by the venue."
      aria-label="Claimed by venue. This profile is managed or confirmed by the venue."
    >
      <span className={cn("flex items-center justify-center rounded-full bg-amber-500 text-white shadow-sm", sizeClasses.iconWrap)}>
        <Check className={sizeClasses.icon} strokeWidth={3} aria-hidden="true" />
      </span>
      <span>{compact ? "Claimed" : "Claimed by venue"}</span>
    </div>
  );
}
