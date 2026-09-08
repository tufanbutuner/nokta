import { Check } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { OwnerFaq } from "@/components/owner/marketing/OwnerFaq";
import { PricingPlansTable } from "@/components/subscriptions/PricingPlansTable";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { brandConfig } from "@/config/brand";
import { trackEvent } from "@/lib/analytics";

const layers = [
  { title: "Discovery", summary: "A better way for customers to find independent social venues.", lines: ["Venue profile and original photos", "Areas, cities and categories", "Vibe filters — groups, late night, birthdays", "Opening info and saved venues"] },
  { title: "Booking requests", summary: "A lightweight way to handle customer interest.", lines: ["Customers request a date, time and party size", "You accept, decline or propose another time", "Customer gets a status page and email updates", "In-app notifications for your team"] },
  { title: "Owner growth", summary: "Simple tools to help your venue improve visibility and track demand.", lines: ["Enquiry inbox and availability settings", "Profile updates and photo uploads", "Analytics you can actually read", "Promoted offers and featured placements"] },
] as const;

const bookingSteps = [
  ["The customer requests", "Date, time, party size, occasion and a message. Nothing is confirmed yet."],
  ["You accept, decline or propose another time", "From your phone, in the dashboard or straight from the notification."],
  ["The customer is told, automatically", "A status page and email updates, so nobody has to chase a reply."],
] as const;

const setupSteps = ["claim your venue", "clean up your profile", "upload original photos", "set availability", "test booking requests", "understand your analytics"];
const venueChips = ["Good for birthdays", "Good for groups", "Open late", "Shows football", "Outdoor seating", "Mocktails", "Dessert", "Private hire", "Date night"];
const claimReasons = ["Make your venue easier to find", "Turn interest into booking requests", "Keep your profile accurate", "Manage enquiries in one place", "See what customers are doing", "Start lightweight, upgrade when you need more"];

export function ForVenuesPage() {
  useEffect(() => { trackEvent("owner_landing_page_viewed"); }, []);

  return (
    <main className="bg-nokta-page-bg text-nokta-ink">
      <PageMeta title={`For venues | ${brandConfig.appName}`} description="Claim your Nokta profile, receive booking requests and manage customer demand from one simple dashboard." canonicalPath="/for-venues" />
      <PageContainer className="space-y-12 py-10 sm:py-12">
        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_372px] lg:items-center">
          <div>
            <Eyebrow>For venues</Eyebrow>
            <h1 className="mt-3 max-w-[560px] text-[34px] font-semibold leading-[1.04] tracking-[-0.8px] sm:text-[52px] sm:tracking-[-1.4px]">Bring more customers to your venue</h1>
            <p className="mt-5 max-w-[520px] text-[17px] leading-[1.65] text-nokta-ink-subtle">Claim your Nokta profile, upload original photos, receive booking requests, manage enquiries and track customer interest from one simple dashboard.</p>
            <div className="mt-[26px] flex flex-col gap-2.5 sm:flex-row">
              <Button asChild className="h-[46px] rounded-[10px] bg-nokta-ink px-5 text-white hover:bg-nokta-ink/90" onClick={() => trackEvent("owner_claim_cta_clicked", { sourceSurface: "for_venues_hero" })}><Link to="/discover">Claim your venue</Link></Button>
              <Button asChild variant="outline" className="h-[46px] rounded-[10px] border-nokta-border bg-white px-5 text-nokta-ink hover:bg-nokta-surface-hover"><Link to="/suggest">List a venue</Link></Button>
            </div>
            <p className="mt-4 text-[13.5px] text-nokta-ink-muted">Free to claim · no card · we set your profile up with you during beta</p>
          </div>
          <OwnerInboxPreview />
        </section>

        <section className="rounded-[22px] bg-nokta-ink p-6 text-white sm:p-[34px]">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-white/50">Where Nokta sits</p>
          <h2 className="mt-2 max-w-[720px] text-[29px] font-semibold leading-[1.22] tracking-[-0.6px]">Most independent venues do not need complex reservation software to get started.</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1.15fr_1fr]">
            <PositionCard title="Instagram, WhatsApp and DMs">Gets you attention. No structure — requests get lost in the inbox, nothing is recorded, and you answer the same questions every night.</PositionCard>
            <div className="rounded-2xl bg-white p-[18px] text-nokta-ink"><h3 className="text-sm font-semibold">Nokta</h3><p className="mt-2 text-[13.5px] leading-[1.6] text-nokta-ink-subtle">A booking-ready profile, structured booking requests, one enquiry inbox and simple reporting. Free to claim, and it works the way your venue already works.</p><div className="mt-3 flex flex-wrap gap-1.5">{["More operational than Instagram", "More focused than a search listing", "Lighter than a reservation system"].map((chip) => <span key={chip} className="rounded-[7px] bg-nokta-page-bg px-2 py-1 text-xs font-medium">{chip}</span>)}</div></div>
            <PositionCard title="Enterprise reservation software">Powerful, and built around table maps, covers, shift rules and CRM setup. More system than most independent lounges and cafes need to start taking bookings.</PositionCard>
          </div>
          <p className="mt-6 text-base font-medium text-white/80">For venues where the experience matters as much as the table.</p>
        </section>

        <section><SectionHeading eyebrow="What you get" title="Three layers, and you only take the ones you need" /><div className="grid gap-3 lg:grid-cols-3">{layers.map((layer, index) => <LayerCard key={layer.title} index={index + 1} {...layer} />)}</div></section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div><SectionHeading eyebrow="How bookings work" title="Start taking structured booking requests without changing how your venue operates" /><p className="max-w-[650px] text-[15.5px] leading-[1.7] text-nokta-ink-subtle">No table map, no floor plan, no shift rules, no CRM setup. Nokta keeps the request-and-confirm flow your venue already runs on — it just stops it living in five different inboxes.</p><div className="mt-5 grid gap-2.5">{bookingSteps.map(([title, body], index) => <BookingStep key={title} index={index + 1} title={title} body={body} />)}</div></div>
          <aside className="rounded-[18px] border border-nokta-border bg-white p-[22px] shadow-sm shadow-stone-950/5"><Eyebrow>We help you get booking-ready</Eyebrow><h3 className="mt-2 text-xl font-semibold tracking-[-0.3px]">Free beta setup support</h3><p className="mt-3 text-sm leading-[1.65] text-nokta-ink-subtle">You don't do the setup on your own. During beta we sit down with you and do it together:</p><div className="mt-4 grid gap-2 text-[13.5px]">{setupSteps.map((step) => <div key={step} className="flex gap-2"><span className="text-clay-accent">—</span><span>{step}</span></div>)}</div><Button asChild className="mt-5 h-11 w-full rounded-[10px] bg-clay-accent text-white hover:bg-clay-accent-hover"><a href={`mailto:${brandConfig.supportEmail}?subject=Nokta%20beta%20setup`}>Book a 20-minute setup call</a></Button></aside>
        </section>

        <PricingPlansTable marketing />

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div><SectionHeading eyebrow="Who it's for" title="Built for social venues, not just restaurants" /><p className="text-[15.5px] leading-[1.7] text-nokta-ink-subtle">Starting with shisha lounges and late-night venues, and built for the ones that don't fit a restaurant booking system: dessert and mocktail lounges, late-night cafes, sports-screening venues, private-hire spaces and independent bars that live on group bookings.</p><div className="mt-5 flex flex-wrap gap-2">{venueChips.map((chip) => <span key={chip} className="inline-flex h-8 items-center rounded-lg border border-nokta-border bg-white px-3 text-[13.5px] font-medium">{chip}</span>)}</div><p className="mt-4 text-[13.5px] leading-[1.6] text-nokta-ink-muted">Customers filter by how they actually choose a venue, so your profile is found by the occasion you're good at.</p></div>
          <aside className="rounded-[18px] border border-nokta-border bg-white p-[22px] shadow-sm shadow-stone-950/5"><Eyebrow>Why owners claim</Eyebrow><div className="mt-4 grid gap-3">{claimReasons.map((reason) => <div key={reason} className="flex items-start gap-2.5 text-sm leading-[1.5]"><Check className="mt-0.5 h-[15px] w-[15px] flex-none text-clay-accent" strokeWidth={2.4} />{reason}</div>)}</div></aside>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]"><div><SectionHeading eyebrow="FAQ" title="What venue owners usually ask first" /><OwnerFaq /></div><aside className="self-start rounded-[20px] bg-nokta-ink p-6 text-white lg:mt-[54px]"><p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-white/50">Ready when you are</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.5px]">Claim your venue or list a new one</h2><p className="mt-3 text-sm leading-[1.65] text-white/70">Get discovered, look credible, receive booking requests and manage demand simply.</p><Button asChild className="mt-5 h-11 w-full rounded-[10px] bg-white text-nokta-ink hover:bg-white/90" onClick={() => trackEvent("owner_claim_cta_clicked", { sourceSurface: "for_venues_cta" })}><Link to="/discover">Claim your venue</Link></Button><Button asChild variant="outline" className="mt-2 h-11 w-full rounded-[10px] border-white/25 text-white hover:bg-white/10"><Link to="/suggest">List a venue</Link></Button><p className="mt-4 text-[12.5px] leading-5 text-white/55">Or email {brandConfig.supportEmail} and we'll set it up with you.</p></aside></section>
      </PageContainer>
    </main>
  );
}

function OwnerInboxPreview() { const rows = [["New booking request", "Fri 20:30 · 4"], ["Enquiry — birthday, 12 people", "2h"], ["Profile views this week", "412"]]; return <aside className="rounded-[20px] border border-nokta-border bg-white p-5 shadow-[0_18px_40px_rgba(28,25,23,.07)]"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold">Majesty Lounge</h2><span className="rounded-full bg-[oklch(0.95_0.05_150)] px-2 py-1 text-xs font-semibold text-[oklch(0.36_0.09_150)]">Claimed</span></div><div className="mt-4 grid gap-2">{rows.map(([label, value]) => <div key={label} className="flex items-center justify-between rounded-[10px] border border-nokta-border px-3 py-2.5 text-[13px]"><span>{label}</span><span className="font-medium text-nokta-ink-muted">{value}</span></div>)}</div><div className="mt-4 grid grid-cols-2 gap-2"><span className="inline-flex h-10 items-center justify-center rounded-lg bg-clay-accent text-[13px] font-medium text-white">Accept</span><span className="inline-flex h-10 items-center justify-center rounded-lg border border-nokta-border text-center text-[13px] font-medium">Propose another time</span></div></aside>; }
function PositionCard({ title, children }: { title: string; children: ReactNode }) { return <div className="rounded-2xl border border-white/15 p-[18px]"><h3 className="text-sm font-semibold text-white">{title}</h3><p className="mt-2 text-[13.5px] leading-[1.6] text-white/60">{children}</p></div>; }
function LayerCard({ index, title, summary, lines }: { index: number; title: string; summary: string; lines: readonly string[] }) { return <article className="rounded-[18px] border border-nokta-border bg-white p-5"><div className="flex items-center gap-3"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-nokta-accent-tint text-[13px] font-bold text-nokta-accent-dark">{index}</span><h3 className="text-base font-semibold">{title}</h3></div><p className="mt-4 text-sm leading-[1.6] text-nokta-ink-subtle">{summary}</p><div className="mt-4 grid gap-[7px] text-[13.5px]">{lines.map((line) => <p key={line}>{line}</p>)}</div></article>; }
function BookingStep({ index, title, body }: { index: number; title: string; body: string }) { return <div className="flex gap-3 rounded-[14px] border border-nokta-border bg-white px-4 py-[15px]"><span className="inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-nokta-ink text-xs font-semibold text-white">{index}</span><div><h3 className="text-[14.5px] font-semibold">{title}</h3><p className="mt-1 text-[13.5px] leading-[1.55] text-nokta-ink-muted">{body}</p></div></div>; }
function Eyebrow({ children }: { children: ReactNode }) { return <p className="text-[13px] font-semibold text-nokta-accent-dark">{children}</p>; }
function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className="mb-5"><Eyebrow>{eyebrow}</Eyebrow><h2 className="mt-2 max-w-[700px] text-[30px] font-semibold leading-[1.2] tracking-[-0.7px]">{title}</h2></div>; }
