import { Skeleton } from "@/components/ui/skeleton";

export function PageLoadingState({ message = "Loading..." }: { message?: string }) {
  const pathname = window.location.pathname;

  if (pathname === "/") {
    return <HomePageLoadingState />;
  }

  // The recommend flow and shared shortlists render on a dark canvas, so the
  // light shell below would flash the wrong colour before the route mounts.
  if (pathname === "/recommend" || pathname.startsWith("/s/")) {
    return <DarkCanvasLoadingState message={message} />;
  }

  const isWorkspaceRoute = pathname.startsWith("/admin") || pathname.startsWith("/owner");

  return (
    <main className={`flex items-center justify-center bg-nokta-page-bg px-4 ${isWorkspaceRoute ? "min-h-[100svh]" : "min-h-[calc(100svh-4rem)]"}`} role="status" aria-label={message}>
      <div className="flex flex-col items-center">
        <span className="font-brand text-2xl font-bold tracking-[-0.6px] text-nokta-ink" aria-hidden="true">nokta<span className="text-clay-accent">.</span></span>
        <span className="mt-4 h-1 w-28 overflow-hidden rounded-full bg-nokta-border" aria-hidden="true">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-clay-accent" />
        </span>
        <span className="sr-only">{message}</span>
      </div>
    </main>
  );
}

/** Mirrors the recommend flow's own chrome: dark canvas, wordmark, progress hairline. */
function DarkCanvasLoadingState({ message }: { message: string }) {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#141312] px-4" role="status" aria-label={message}>
      <span className="font-brand text-2xl font-bold tracking-[-0.6px] text-white" aria-hidden="true">
        nokta<span className="text-clay-accent">.</span>
      </span>
      <span className="mt-4 h-1 w-28 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
        <span className="block h-full w-1/2 animate-pulse rounded-full bg-clay-accent" />
      </span>
      <span className="sr-only">{message}</span>
    </main>
  );
}

/**
 * Mirrors the map homepage: cream map ground under the header with the search
 * pill and locate button, a 296px bottom sheet on phones, and a 440px list panel
 * beside the map on desktop.
 */
function HomePageLoadingState() {
  return (
    <main data-full-viewport className="relative h-[calc(100dvh-65px)] overflow-hidden bg-[#f7f1e8] lg:grid lg:grid-cols-[440px_1fr]" role="status" aria-label="Loading places">
      <div className="absolute inset-0 lg:relative lg:col-start-2 lg:row-start-1">
        <div className="absolute inset-x-0 top-0 p-3.5 sm:p-5">
          <div className="flex h-[50px] items-center gap-2.5 rounded-[14px] border border-nokta-border bg-white/95 pl-3.5 pr-1.5 lg:max-w-[460px]">
            <Skeleton className="h-[18px] w-[18px] rounded-full" />
            <Skeleton className="h-4 flex-1 max-w-[180px]" />
            <Skeleton className="ml-auto h-[38px] w-[88px] rounded-full" />
          </div>
        </div>
        <span aria-hidden="true" className="absolute bottom-[310px] right-3.5 h-11 w-11 rounded-full border border-nokta-border bg-white sm:right-5 lg:bottom-8" />
      </div>

      <section className="absolute inset-x-0 bottom-0 flex h-[296px] flex-col rounded-t-[20px] bg-white shadow-[0_-10px_30px_-14px_rgba(42,33,27,0.35)] lg:relative lg:col-start-1 lg:row-start-1 lg:h-full lg:rounded-none lg:border-r lg:border-nokta-border lg:shadow-none">
        <div className="grid place-items-center pb-1 pt-2.5 lg:hidden">
          <span className="h-1 w-[38px] rounded-full bg-nokta-border" />
        </div>
        <div className="px-[18px] pb-2.5 pt-1 lg:pt-6">
          <Skeleton className="h-6 w-44 lg:h-7" />
        </div>
        <div className="flex gap-2 overflow-hidden px-[18px] pb-1">
          {[78, 84, 72, 74, 56].map((width, index) => <Skeleton key={index} className="h-[38px] shrink-0 rounded-full" style={{ width }} />)}
        </div>

        <div className="flex gap-3 overflow-hidden px-[18px] pb-2 pt-3 lg:hidden">
          {[0, 1].map((key) => <HomeVenueCardSkeleton key={key} />)}
        </div>
        <div className="mx-[18px] flex h-11 items-center border-t border-nokta-divider lg:hidden">
          <Skeleton className="h-4 w-36" />
        </div>

        <div className="hidden min-h-0 flex-1 overflow-hidden px-[18px] pt-2 lg:block">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="grid grid-cols-[92px_1fr] gap-3 border-t border-nokta-divider py-3.5 first:border-t-0">
              <Skeleton className="h-[92px] w-[92px] rounded-[10px]" />
              <div className="space-y-2 pt-1">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function HomeVenueCardSkeleton() {
  return (
    <div className="grid w-[78%] max-w-[330px] shrink-0 grid-cols-[84px_1fr] gap-[11px] rounded-[14px] border border-nokta-border bg-white p-2.5">
      <Skeleton className="h-[84px] w-[84px] rounded-[10px]" />
      <div className="space-y-2 pt-1">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
