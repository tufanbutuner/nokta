import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { VerificationStatus } from "@/types/venue";

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  verified: "Verified",
  "partially-verified": "Partially verified",
  unverified: "Unverified",
};

const VERIFICATION_CLASSES: Record<VerificationStatus, string> = {
  verified: "border-emerald-200 bg-emerald-50 text-emerald-800",
  "partially-verified": "border-stone-200 bg-stone-100 text-stone-700",
  unverified: "border-red-200 bg-red-50 text-red-800",
};

export function VenueVerificationBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  return (
    <Badge variant="outline" className={cn(VERIFICATION_CLASSES[status], className)}>
      {VERIFICATION_LABELS[status]}
    </Badge>
  );
}
