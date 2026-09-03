import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";

export function RouteErrorState({
  title = "Something went wrong",
  description = "We could not load this part of nokta. Try again or go back to Discover.",
  devDetail,
}: {
  title?: string;
  description?: string;
  devDetail?: string | null;
}) {
  return (
    <>
      <header className="border-b bg-background/95">
        <div className="flex h-16 w-full items-center px-4 sm:px-6">
          <Link to="/" className="text-sm font-semibold uppercase tracking-[0.18em]">
            nokta
          </Link>
        </div>
      </header>
      <main className="min-h-[calc(100vh-8rem)] bg-background">
        <PageContainer className="flex min-h-[calc(100vh-8rem)] items-center py-16">
          <section className="mx-auto w-full max-w-2xl rounded-2xl border bg-card p-6 text-center shadow-xl shadow-stone-950/5 sm:p-10">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">nokta</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
            {devDetail ? (
              <pre className="mt-6 max-h-40 overflow-auto rounded-xl border bg-background p-4 text-left text-xs text-muted-foreground">{devDetail}</pre>
            ) : null}
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button type="button" onClick={() => window.location.reload()}>
                Try again
              </Button>
              <Button asChild variant="outline">
                <Link to="/discover">
                  Back to Discover
                </Link>
              </Button>
              <Button asChild variant="ghost">
                <Link to="/">
                  Back home
                </Link>
              </Button>
            </div>
          </section>
        </PageContainer>
      </main>
    </>
  );
}
