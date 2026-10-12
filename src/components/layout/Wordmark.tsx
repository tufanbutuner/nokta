import { brandConfig } from "@/config/brand";
import { cn } from "@/lib/utils";

// "nokta" is Turkish for "dot", so the wordmark ends on one.
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline font-wordmark text-xl font-bold tracking-[0.02em]", className)}>
      {brandConfig.logoText}
      <span aria-hidden="true" className="ml-[0.08em] inline-block size-[0.28em] rounded-full bg-nokta-accent" />
    </span>
  );
}
