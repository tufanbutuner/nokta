import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ClaimedVenueBadgeProps {
  compact?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function ClaimedVenueBadge({ size = "sm", className }: ClaimedVenueBadgeProps) {
  const sizeClasses =
    size === "md"
      ? {
          root: "h-5 w-5",
          icon: "h-3.5 w-3.5",
        }
      : {
          root: "h-4 w-4",
          icon: "h-3 w-3",
        };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex shrink-0 items-center justify-center rounded-full bg-nokta-ink text-white",
            sizeClasses.root,
            className,
          )}
          aria-label="Claimed by venue"
        >
          <Check className={sizeClasses.icon} strokeWidth={3} aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>Claimed by venue</TooltipContent>
    </Tooltip>
  );
}
