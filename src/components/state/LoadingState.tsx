import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState({ message = "Loading venues..." }: { message?: string }) {
  return (
    <div className="rounded-lg border border-nokta-border bg-white p-5 shadow-sm shadow-stone-950/5" role="status" aria-label={message}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Skeleton className="h-8 rounded-full" />
          <Skeleton className="h-8 rounded-full" />
          <Skeleton className="h-8 rounded-full" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <span className="sr-only">{message}</span>
    </div>
  );
}
