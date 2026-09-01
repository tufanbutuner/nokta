import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { brandConfig } from "@/config/brand";

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden bg-nokta-ink py-12 text-sm text-white/72 sm:py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 z-0 h-60 w-60 translate-y-[68%] -translate-x-1/2 rounded-full bg-nokta-accent sm:h-80 sm:w-80 lg:h-96 lg:w-96"
      />
      <PageContainer className="relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-wordmark text-xl font-bold tracking-[-0.5px] text-white">{brandConfig.logoText}</p>
          <p className="mt-2 font-medium text-white">Your spot, found.</p>
          <p className="mt-3 leading-6">
            {brandConfig.longDescription} Venue details can change, so always check directly before travelling or booking.
          </p>
        </div>
        <nav className="mx-auto mt-8 flex max-w-2xl flex-wrap justify-center gap-x-5 gap-y-2 text-center" aria-label="Footer">
          <Link reloadDocument to="/discover" className="hover:text-white">
            Discover
          </Link>
          <Link reloadDocument to="/recommend" className="hover:text-white">
            Recommend
          </Link>
          <Link reloadDocument to="/suggest" className="hover:text-white">
            Suggest
          </Link>
          <Link reloadDocument to="/for-venues" className="hover:text-white">
            For venues
          </Link>
          <Link reloadDocument to="/privacy" className="hover:text-white">
            Privacy
          </Link>
          <Link reloadDocument to="/terms" className="hover:text-white">
            Terms
          </Link>
          <a href={`mailto:${brandConfig.supportEmail}`} className="hover:text-white">
            Contact
          </a>
        </nav>
      </PageContainer>
    </footer>
  );
}
