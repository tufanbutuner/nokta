import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeaturedBadge({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-purple-300/70 bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-950 shadow-sm",
        className,
      )}
      title="This venue is featured by nokta."
      aria-label="Featured placement"
    >
      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
      <span>{compact ? "Featured" : "Featured venue"}</span>
    </div>
  );
}
