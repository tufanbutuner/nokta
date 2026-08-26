import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";

export function Footer() {
  return (
    <footer className="mt-20 border-t bg-card/30 py-10 text-sm text-muted-foreground">
      <PageContainer className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="max-w-2xl">
          <p className="font-brand text-xl font-bold tracking-[-0.5px] text-foreground">sheesh.</p>
          <p className="mt-3 leading-6">
            Sheesha helps people discover shisha lounges across London. Venue details can change, so always check directly before travelling or booking.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 lg:justify-end" aria-label="Footer">
          <Link reloadDocument to="/discover" className="hover:text-foreground">
            Discover
          </Link>
          <Link reloadDocument to="/recommend" className="hover:text-foreground">
            Recommend
          </Link>
          <Link reloadDocument to="/suggest" className="hover:text-foreground">
            Suggest
          </Link>
          <Link reloadDocument to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link reloadDocument to="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <a href="mailto:hello@sheesh.london" className="hover:text-foreground">
            Contact
          </a>
        </nav>
      </PageContainer>
    </footer>
  );
}
