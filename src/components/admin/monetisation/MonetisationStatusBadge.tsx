import { Badge } from "@/components/ui/badge";
import { formatMonetisationStatus } from "@/lib/monetisationLabels";
import { cn } from "@/lib/utils";
import type { MonetisationStatus } from "@/types/monetisation";

const STATUS_CLASSES: Record<MonetisationStatus, string> = {
  "not-contacted": "border-transparent bg-clay-100 text-[#8a7e72]",
  contacted: "border-transparent bg-clay-300/20 text-[#9a6e3e]",
  interested: "border-transparent bg-clay-300/20 text-[#9a6e3e]",
  trial: "border-transparent bg-clay-400/10 text-clay-400",
  paying: "border-transparent bg-forest-50 text-forest-400",
  churned: "border-transparent bg-clay-400/10 text-[#a04030]",
  "not-fit": "border-transparent bg-clay-100 text-[#8a7e72]",
};

export function MonetisationStatusBadge({ status }: { status: MonetisationStatus }) {
  return (
    <Badge variant="outline" className={cn("w-fit rounded px-2 py-0.5 text-[10px] font-semibold", STATUS_CLASSES[status])}>
      {formatMonetisationStatus(status)}
    </Badge>
  );
}
