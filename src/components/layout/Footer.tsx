import { PageContainer } from "@/components/layout/PageContainer";

export function Footer() {
  return (
    <footer className="mt-20 border-t py-8 text-sm text-muted-foreground">
      <PageContainer className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span>Sheesha</span>
        <span>Curated venue discovery for London.</span>
      </PageContainer>
    </footer>
  );
}
