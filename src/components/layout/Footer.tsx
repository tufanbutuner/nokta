import { Link } from "react-router-dom";
import { PageContainer } from "@/components/layout/PageContainer";
import { Wordmark } from "@/components/layout/Wordmark";
import { brandConfig } from "@/config/brand";
import { getActiveCities } from "@/lib/cities";

// London leads; the rest follow in the order they launched.
const FOOTER_CITY_COUNT = 6;

const EXPLORE_LINKS = [
  { to: "/", label: "Map" },
  { to: "/plan", label: "Plan a night" },
  { to: "/saved", label: "Saved" },
  { to: "/suggest", label: "Suggest a venue" },
];

const VENUE_LINKS = [
  { to: "/for-venues", label: "List your venue" },
  { to: "/owner", label: "Owner dashboard" },
];

const linkClass =
  "inline-flex min-h-9 items-center text-white/70 transition-colors hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:underline focus-visible:underline-offset-4 sm:min-h-8";

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <ul className="mt-3 grid gap-0.5">{children}</ul>
    </div>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function Footer() {
  const cities = getActiveCities().slice(0, FOOTER_CITY_COUNT);
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/5 bg-nokta-footer text-sm text-white/70">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 -right-20 size-56 rounded-full bg-nokta-accent-solid sm:-bottom-36 sm:size-72"
      />
      <PageContainer className="relative pb-8 pt-12 sm:pt-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)] lg:gap-16">
          <div className="max-w-sm">
            <Link to="/" className="inline-flex text-white" aria-label="nokta home">
              <Wordmark className="text-2xl" />
            </Link>
            <p className="mt-4 text-base font-medium text-white">Find your spot.</p>
            <p className="mt-2 leading-6">{brandConfig.longDescription}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              <a href={`mailto:${brandConfig.supportEmail}`} className={linkClass}>
                {brandConfig.supportEmail}
              </a>
              <a href={brandConfig.instagramUrl} target="_blank" rel="noreferrer" className={`${linkClass} gap-2`}>
                <InstagramIcon className="size-4" />
                Instagram
              </a>
            </div>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
            <FooterColumn title="Explore">
              {EXPLORE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>
            <FooterColumn title="Cities">
              {cities.map((city) => (
                <li key={city.slug}>
                  <Link to={`/cities/${city.slug}`} className={linkClass}>
                    {city.name}
                  </Link>
                </li>
              ))}
            </FooterColumn>
            <FooterColumn title="For venues">
              {VENUE_LINKS.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </FooterColumn>
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-x-8 gap-y-3 border-t border-white/10 pr-36 pt-6 text-xs text-white/55 sm:flex-row sm:flex-wrap sm:items-center sm:pr-56">
          <p className="max-w-md leading-5">
            Venue details can change. Check with the venue before you travel or book.
          </p>
          <div className="flex items-center gap-5">
            <span>© {year} {brandConfig.appName}</span>
            <Link to="/privacy" className="transition-colors hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="transition-colors hover:text-white">
              Terms
            </Link>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
}
