import { Mail } from "lucide-react";
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
          <p className="mt-2 font-medium text-white">Find your spot.</p>
          <p className="mt-3 leading-6">
            {brandConfig.longDescription} Venue details can change, so always check directly before travelling or booking.
          </p>
        </div>
        <div className="mx-auto mt-10 grid max-w-3xl gap-8 border-t border-white/10 pt-8 text-center sm:grid-cols-2 sm:text-left">
          <nav className="space-y-3" aria-label="Footer pages">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Pages</p>
            <div className="grid gap-2">
              <Link to="/discover" className="hover:text-white">Discover</Link>
              <Link to="/recommend" className="hover:text-white">Recommend</Link>
              <Link to="/suggest" className="hover:text-white">Suggest</Link>
              <Link to="/for-venues" className="hover:text-white">For venues</Link>
              <Link to="/privacy" className="hover:text-white">Privacy</Link>
              <Link to="/terms" className="hover:text-white">Terms</Link>
            </div>
          </nav>
          <div className="space-y-3 sm:text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Contact</p>
            <a href={`mailto:${brandConfig.supportEmail}`} className="block font-medium text-white hover:text-white/80">
              {brandConfig.supportEmail}
            </a>
            <div className="flex justify-center gap-3 sm:justify-end">
              <a
                href={`mailto:${brandConfig.supportEmail}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white"
                aria-label={`Email ${brandConfig.supportEmail}`}
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href={brandConfig.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/75 transition hover:bg-white/10 hover:text-white"
                aria-label="Nokta on Instagram"
              >
                <span className="text-xs font-bold tracking-[0.08em]">IG</span>
              </a>
            </div>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
