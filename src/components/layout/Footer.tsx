import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { brandConfig } from "@/config/brand";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-nokta-border bg-card/30 py-10 text-sm text-nokta-ink-muted">
      <PageContainer className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-nokta-accent" aria-hidden="true" />
            <p className="font-wordmark text-xl font-bold tracking-[-0.5px] text-nokta-ink">{brandConfig.logoText}</p>
          </div>
          <p className="mt-2 font-medium text-nokta-ink">Your spot, found.</p>
          <p className="mt-3 leading-6">
            {brandConfig.longDescription} Venue details can change, so always check directly before travelling or booking.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-5 gap-y-2 lg:justify-end" aria-label="Footer">
          <Link reloadDocument to="/discover" className="hover:text-nokta-ink">
            Discover
          </Link>
          <Link reloadDocument to="/recommend" className="hover:text-nokta-ink">
            Recommend
          </Link>
          <Link reloadDocument to="/suggest" className="hover:text-nokta-ink">
            Suggest
          </Link>
          <Link reloadDocument to="/privacy" className="hover:text-nokta-ink">
            Privacy
          </Link>
          <Link reloadDocument to="/terms" className="hover:text-nokta-ink">
            Terms
          </Link>
          <a href={`mailto:${brandConfig.supportEmail}`} className="hover:text-nokta-ink">
            Contact
          </a>
        </nav>
      </PageContainer>
    </footer>
  );
}
