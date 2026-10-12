import { ArrowRight, RotateCcw, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Wordmark } from "@/components/layout/Wordmark";
import { Button } from "@/components/ui/button";

export function RouteErrorState({
  title = "Something went wrong",
  description = "We could not load this page. Try again, or head back to the map.",
  devDetail,
  showRetry = true,
}: {
  title?: string;
  description?: string;
  devDetail?: string | null;
  showRetry?: boolean;
}) {
  return (
    <>
      <header className="border-b border-nokta-border bg-nokta-surface-alt">
        <PageContainer className="flex h-16 items-center">
          <Link to="/" className="text-nokta-ink" aria-label="nokta home">
            <Wordmark />
          </Link>
        </PageContainer>
      </header>

      <main className="flex min-h-[calc(100svh-4rem)] items-center bg-nokta-page-bg py-12 text-nokta-ink sm:py-20">
        <PageContainer>
          <section aria-labelledby="route-error-title" className="mx-auto w-full max-w-[680px] overflow-hidden rounded-[20px] border border-nokta-border bg-nokta-surface shadow-[0_12px_40px_rgba(28,25,23,0.06)]">
            <div className="h-1.5 bg-clay-accent" aria-hidden="true" />
            <div className="px-6 py-8 sm:px-10 sm:py-11">
              <span className="inline-flex size-12 items-center justify-center rounded-[14px] bg-nokta-accent-tint text-nokta-accent" aria-hidden="true">
                <TriangleAlert className="size-6" strokeWidth={1.8} />
              </span>
              <p className="mt-7 text-xs font-semibold uppercase tracking-[0.16em] text-nokta-accent">Page unavailable</p>
              <h1 id="route-error-title" className="mt-2 text-[32px] font-semibold leading-[1.12] tracking-[-0.035em] sm:text-[42px]">{title}</h1>
              <p className="mt-4 max-w-[490px] text-[15px] leading-7 text-nokta-ink-subtle">{description}</p>

              <div className="mt-8 flex flex-wrap gap-3">
                {showRetry ? (
                  <Button type="button" className="h-11 bg-clay-accent px-5 text-white hover:bg-clay-accent-hover" onClick={() => window.location.reload()}>
                    <RotateCcw className="mr-2 size-4" />
                    Try again
                  </Button>
                ) : null}
                <Button asChild variant={showRetry ? "outline" : "default"} className={showRetry ? "h-11 border-nokta-border bg-nokta-surface px-5 text-nokta-ink hover:bg-nokta-hover" : "h-11 bg-clay-accent px-5 text-white hover:bg-clay-accent-hover"}>
                  <Link to="/">
                    Back to the map
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>

              {devDetail ? (
                <details className="mt-8 border-t border-nokta-border pt-5 text-sm text-nokta-ink-muted">
                  <summary className="cursor-pointer font-medium text-nokta-ink-subtle">Error details</summary>
                  <pre className="mt-3 max-h-40 overflow-auto rounded-lg bg-nokta-page-bg p-4 text-xs whitespace-pre-wrap break-words">{devDetail}</pre>
                </details>
              ) : null}
            </div>
          </section>
        </PageContainer>
      </main>
    </>
  );
}
