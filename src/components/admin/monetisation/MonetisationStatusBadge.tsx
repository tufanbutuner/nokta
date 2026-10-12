import { Badge } from "@/components/ui/badge";
import { formatMonetisationStatus } from "@/lib/monetisationLabels";
import { cn } from "@/lib/utils";
import type { MonetisationStatus } from "@/types/monetisation";

const STATUS_CLASSES: Record<MonetisationStatus, string> = {
  "not-contacted": "border-transparent bg-nokta-track text-nokta-ink-muted",
  contacted: "border-transparent bg-nokta-warn-solid/20 text-nokta-warn-ink",
  interested: "border-transparent bg-nokta-warn-solid/20 text-nokta-warn-ink",
  trial: "border-transparent bg-nokta-accent-solid/10 text-nokta-accent-dark",
  paying: "border-transparent bg-nokta-ok-tint text-nokta-ok-ink",
  churned: "border-transparent bg-nokta-accent-solid/10 text-nokta-bad-ink",
  "not-fit": "border-transparent bg-nokta-track text-nokta-ink-muted",
};

export function MonetisationStatusBadge({ status }: { status: MonetisationStatus }) {
  return (
    <Badge variant="outline" className={cn("w-fit rounded px-2 py-0.5 text-[11px] font-semibold", STATUS_CLASSES[status])}>
      {formatMonetisationStatus(status)}
    </Badge>
  );
}
