import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { OwnerFaq } from "@/components/owner/marketing/OwnerFaq";
import { OwnerHowItWorks } from "@/components/owner/marketing/OwnerHowItWorks";
import { OwnerValueCards } from "@/components/owner/marketing/OwnerValueCards";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { brandConfig } from "@/config/brand";
import { trackEvent } from "@/lib/analytics";

const ownerTools = ["Trusted venue profile", "Original photos", "Booking requests", "Customer enquiries", "Availability settings", "Visibility tools"];

export function ForVenuesPage() {
  useEffect(() => {
    trackEvent("owner_landing_page_viewed");
  }, []);

  return (
    <main className="bg-nokta-page-bg text-nokta-ink">
      <PageMeta
        title={`For venues | ${brandConfig.appName}`}
        description="Nokta helps independent social venues get discovered, look trustworthy and manage booking requests from one simple dashboard."
        canonicalPath="/for-venues"
      />
      <PageContainer className="space-y-16 py-12 sm:py-16">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-nokta-accent-dark">For venues</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">Bring more customers to your venue</h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-nokta-ink-muted sm:text-lg">
              Nokta helps independent social venues get discovered, look trustworthy and manage booking requests from one simple dashboard.
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-nokta-ink-muted sm:text-base">
              Claim your profile, upload original photos, keep your details accurate, receive booking requests and track enquiries without heavy reservation software.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-11 rounded-xl bg-nokta-ink text-white hover:bg-nokta-ink/90" onClick={() => trackEvent("owner_claim_cta_clicked", { sourceSurface: "for_venues_hero" })}>
                <Link to="/discover">Claim your venue</Link>
              </Button>
              <Button asChild variant="outline" className="h-11 rounded-xl border-nokta-border bg-white text-nokta-ink hover:bg-nokta-surface-hover">
                <Link to="/suggest">List a venue</Link>
              </Button>
            </div>
          </div>
          <aside className="relative isolate overflow-hidden rounded-3xl border border-nokta-border bg-white p-6 shadow-xl shadow-stone-950/5">
            <CardMark className="-bottom-14 -right-12 h-44 w-44 opacity-[0.07]" />
            <p className="text-sm font-semibold text-nokta-ink">Owner dashboard</p>
            <div className="relative mt-5 space-y-3">
              {ownerTools.map((tool) => (
                <div key={tool} className="flex items-center gap-3 rounded-xl border border-nokta-border bg-nokta-page-bg/40 p-3 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-nokta-accent" />
                  {tool}
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section>
          <SectionHeading eyebrow="Why claim" title="Get discovered, look credible and manage demand simply" />
          <OwnerValueCards />
        </section>

        <section>
          <SectionHeading eyebrow="How it works" title="A lightweight flow for independent social venues" />
          <OwnerHowItWorks />
        </section>

        <section className="grid gap-6 rounded-3xl bg-nokta-ink p-6 text-white sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-white/65">Ready when you are</p>
            <h2 className="mt-2 text-3xl font-semibold">Claim your venue or list a new one</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
              Starting with shisha lounges, Nokta is built for social venues where the experience matters as much as the table.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="bg-white text-nokta-ink hover:bg-white/90" onClick={() => trackEvent("owner_claim_cta_clicked", { sourceSurface: "for_venues_cta" })}>
              <Link to="/discover">Claim your venue<ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline" className="border-white/25 text-white hover:bg-white/10">
              <Link to="/suggest">List a venue</Link>
            </Button>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="FAQ" title="What venue owners usually ask first" />
          <OwnerFaq />
        </section>
      </PageContainer>
    </main>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-nokta-accent-dark">{eyebrow}</p>
      <h2 className="mt-2 max-w-2xl text-3xl font-semibold text-nokta-ink">{title}</h2>
    </div>
  );
}

function CardMark({ className }: { className: string }) {
  return <img src="/nokta-dot.svg" alt="" aria-hidden="true" className={`pointer-events-none absolute -z-10 ${className}`} />;
}
