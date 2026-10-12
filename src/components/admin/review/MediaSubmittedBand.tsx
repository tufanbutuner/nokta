import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PhotoDecision } from "@/types/adminReviewQueue";
import type { VenueMedia } from "@/types/venueMedia";

export function MediaSubmittedBand({
  media,
  decisions,
  onToggle,
}: {
  media: VenueMedia[];
  decisions: Record<string, PhotoDecision>;
  onToggle: (mediaId: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-[10px]">
      {media.map((item) => {
        const decision = decisions[item.id];
        return (
          <figure key={item.id}>
            <button
              type="button"
              onClick={() => onToggle(item.id)}
              aria-pressed={decision === "approve"}
              aria-label={`${decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Undecided"} — ${item.fileName ?? "photo"}. Click to toggle.`}
              className={cn(
                "relative block h-[118px] w-full overflow-hidden rounded-lg border-2 transition-colors",
                decision === "approve" && "border-nokta-accent",
                decision === "reject" && "border-nokta-bad-line bg-nokta-bad-tint",
                !decision && "border-transparent hover:border-border",
              )}
            >
              <img src={item.url} alt={item.altText ?? ""} className={cn("h-full w-full object-cover", decision === "reject" && "opacity-50")} />
              {decision ? (
                <span
                  className={cn(
                    "absolute left-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2",
                    decision === "approve" ? "border-nokta-accent bg-nokta-accent-solid text-white" : "border-nokta-bad-line bg-nokta-surface text-nokta-bad-ink",
                  )}
                >
                  {decision === "approve" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </span>
              ) : null}
            </button>
            <figcaption className={cn("mt-1 truncate text-xs", decision === "reject" ? "font-medium text-nokta-bad-ink" : "text-nokta-ink-muted")}>
              {item.caption ?? item.fileName ?? "Untitled photo"}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
