import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";

export function NotFoundPage() {
  return (
    <main>
      <PageContainer className="py-20">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <Button asChild className="mt-6">
          <Link reloadDocument to="/">Go home</Link>
        </Button>
      </PageContainer>
    </main>
  );
}
