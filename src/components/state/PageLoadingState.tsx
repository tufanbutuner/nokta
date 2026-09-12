import { Skeleton } from "@/components/ui/skeleton";

export function PageLoadingState({ message = "Loading..." }: { message?: string }) {
  const pathname = window.location.pathname;

  if (pathname === "/") {
    return <HomePageLoadingState />;
  }

  if (pathname === "/discover") {
    return <DiscoverPageLoadingState />;
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

function HomePageLoadingState() {
  return (
    <main>
      <section>
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="relative isolate mx-auto max-w-5xl px-4 py-12 text-center sm:px-8 sm:py-16 lg:py-20">
            <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[24rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-clay-accent opacity-[0.08] sm:h-[30rem] sm:w-[30rem] lg:h-[34rem] lg:w-[34rem]" />
            <Skeleton className="mx-auto h-10 w-full max-w-3xl sm:h-16 lg:h-20" />
            <Skeleton className="mx-auto mt-3 h-10 w-full max-w-2xl sm:h-16 lg:h-20" />
            <Skeleton className="mx-auto mt-6 h-5 w-full max-w-xl" />
            <Skeleton className="mx-auto mt-3 h-5 w-full max-w-lg" />
            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border bg-card p-2 shadow-xl shadow-stone-950/5">
              <Skeleton className="h-10 rounded-xl" />
            </div>
            <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl space-y-14 px-4 py-10 sm:space-y-16 sm:px-6 sm:py-14 lg:px-8">
        <section>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <article key={index} className="overflow-hidden rounded-2xl border border-nokta-border bg-card p-5">
                <div className="flex items-start justify-between gap-4">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-7 w-16 rounded-full" />
                </div>
                <Skeleton className="mt-5 h-4 w-full" />
                <Skeleton className="mt-3 h-4 w-4/5" />
                <Skeleton className="mt-5 h-5 w-32" />
              </article>
            ))}
          </div>
        </section>

        <HomeCardsLoadingSection columns="md:grid-cols-3" count={3} />
        <HomeCardsLoadingSection columns="md:grid-cols-3" count={3} />
        <HomeCardsLoadingSection columns="sm:grid-cols-2 lg:grid-cols-4" count={4} />
      </div>
    </main>
  );
}

function HomeCardsLoadingSection({ columns, count }: { columns: string; count: number }) {
  return (
    <section>
      <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-56" />
        </div>
        <Skeleton className="h-10 w-24 rounded-full" />
      </div>
      <div className={`grid gap-5 ${columns}`}>
        {Array.from({ length: count }).map((_, index) => (
          <article key={index} className="overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface p-2">
            <Skeleton className="h-[190px] rounded-xl" />
            <div className="space-y-3 px-2 pb-2 pt-3">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
              <div className="flex items-center justify-between gap-3 pt-1">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-7 w-20 rounded-full" />
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function DiscoverPageLoadingState() {
  return (
    <main className="bg-background">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-none flex-col bg-nokta-page-bg px-3 py-3 lg:h-[calc(100vh-4rem)]">
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[440px_minmax(0,1fr)]">
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface shadow-[0_12px_30px_-16px_oklch(0.2_0.02_40_/_0.18)]">
            <div className="space-y-3 border-b border-nokta-border p-4">
              <Skeleton className="h-11 rounded-full bg-white/80" />
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
            <div className="border-b border-nokta-border bg-nokta-surface-alt p-4">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-8 w-20 rounded-full" />
              </div>
            </div>
            <div className="min-h-[420px] flex-1 space-y-2 overflow-hidden p-3">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="rounded-xl border border-nokta-border bg-white p-2">
                  <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-3">
                    <Skeleton className="h-[72px] w-[88px] rounded-lg" />
                    <div className="min-w-0 space-y-2 py-1">
                      <Skeleton className="h-4 w-4/5" />
                      <Skeleton className="h-3 w-3/5" />
                      <div className="flex items-center gap-2 pt-1">
                        <Skeleton className="h-4 w-10 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <section className="hidden min-h-[560px] overflow-hidden rounded-2xl border border-nokta-border bg-nokta-surface shadow-[0_12px_30px_-16px_oklch(0.2_0.02_40_/_0.18)] lg:block lg:min-h-0">
            <div className="relative h-full min-h-[560px] w-full overflow-hidden bg-nokta-surface lg:min-h-0">
              <Skeleton className="absolute inset-0 rounded-none bg-nokta-border/35" />
              <div className="absolute left-5 top-5 space-y-2">
                <Skeleton className="h-10 w-10 rounded-lg bg-white/80" />
                <Skeleton className="h-10 w-10 rounded-lg bg-white/80" />
              </div>
              <Skeleton className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nokta-accent/25" />
              <Skeleton className="absolute bottom-5 left-5 h-12 w-52 rounded-xl bg-white/80" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
