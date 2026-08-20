import { cn } from "@/lib/utils";

export function PageContainer({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1180px] px-4", className)}>{children}</div>;
}
