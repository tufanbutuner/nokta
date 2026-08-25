import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main>
      <PageMeta title="Page not found | Sheesha" description="This page does not exist or may have moved." />
      <PageContainer className="flex min-h-[60vh] items-center py-20">
        <section className="mx-auto max-w-xl text-center">
          <p className="text-sm font-medium text-muted-foreground">404</p>
          <h1 className="mt-2 text-4xl font-semibold">Page not found</h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">This page does not exist or may have moved.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link reloadDocument to="/discover">
                Explore Discover
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link reloadDocument to="/recommend">
                Get a recommendation
              </Link>
            </Button>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
