import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { isPaidPlan, type PaidVenuePlan } from "@/lib/stripePlanConfig";
import { cn } from "@/lib/utils";
import type { VenuePlan, VenueSubscriptionStatus } from "@/types/subscriptions";

interface DisplayPlan {
  plan: Extract<VenuePlan, "free" | "growth" | "pro">;
  name: string;
  pill?: string;
  price: number;
  band: string;
  bandNote: string;
  positioning: string;
  features: { text: string; comingSoon?: boolean }[];
}

const DISPLAY_PLANS: DisplayPlan[] = [
  {
    plan: "free", name: "Claimed", pill: "Always free", price: 0,
    band: "10 accepted bookings a month",
    bandNote: "Requests keep arriving after that — we just tell you it's time to upgrade.",
    positioning: "Be found, look right, take bookings",
    features: [
      { text: "Your own photos, hours, menu and venue details — edit any time" },
      { text: "Unlimited booking requests and enquiries" },
      { text: "Accept, decline or propose another time" },
      { text: "Email and in-app notifications, one team login" },
      { text: "Last 30 days of views, requests and answer rate" },
    ],
  },
  {
    plan: "growth", name: "Growth", pill: "Most venues", price: 49,
    band: "80 accepted bookings a month",
    bandNote: "Two or three on a busy weekend night. One of them covers the plan.",
    positioning: "Handle demand without living in your inbox",
    features: [
      { text: "Requests forwarded to WhatsApp, plus saved replies", comingSoon: true },
      { text: "Automatic booking reminders, fewer no-shows", comingSoon: true },
      { text: "Up to 5 team logins with their own notifications", comingSoon: true },
      { text: "Full history, demand insights and a monthly report" },
      { text: "Your own QR booking page for tables and flyers", comingSoon: true },
      { text: "Same-day profile changes, no review queue wait" },
    ],
  },
  {
    plan: "pro", name: "Pro", price: 99,
    band: "Unlimited accepted bookings",
    bandNote: "Across up to 3 venues on one account.",
    positioning: "More than one venue, and visibility when you want it",
    features: [
      { text: "Everything in Growth, for up to 3 venues" },
      { text: "Two promoted offers a month, with reporting" },
      { text: "Private hire and event enquiry forms" },
      { text: "Repeat customer view — who books you again", comingSoon: true },
      { text: "A quarterly call to go through your numbers" },
    ],
  },
];

export function PricingPlansTable({
  onChoosePlan,
  isChoosingPlan,
  disabled,
  currentPlan = "free",
  currentStatus = "inactive",
  marketing = false,
}: {
  onChoosePlan?: (plan: PaidVenuePlan) => void;
  isChoosingPlan?: PaidVenuePlan | null;
  disabled?: boolean;
  currentPlan?: VenuePlan;
  currentStatus?: VenueSubscriptionStatus;
  marketing?: boolean;
}) {
  const hasCurrentAccess = currentStatus === "active" || currentStatus === "trial" || currentStatus === "past_due";

  return (
    <section id={marketing ? "plans" : undefined}>
      <div className="mb-5 grid gap-3 lg:grid-cols-[1fr_420px] lg:items-end">
        <div><p className="text-[13px] font-semibold text-nokta-accent-dark">Plans</p><h2 className="mt-2 text-[30px] font-semibold leading-[1.2] tracking-[-0.7px]">Everything you need to get booked is free</h2></div>
        <p className="text-sm leading-[1.6] text-nokta-ink-muted">Every plan takes unlimited requests and enquiries. Nokta is a lighter alternative for venues that do not need a full enterprise reservation system.</p>
      </div>
      <div className="grid items-stretch gap-3.5 lg:grid-cols-[1.12fr_1fr_1fr]">
        {DISPLAY_PLANS.map((plan) => {
          const isCurrentPlan = plan.plan === currentPlan && (plan.plan === "free" || hasCurrentAccess);
          const highlighted = plan.plan === "growth";
          return (
            <article key={plan.plan} className={cn("flex rounded-[18px] border border-nokta-border bg-white p-[22px]", highlighted && "border-2 border-clay-accent p-[21px] shadow-[0_12px_30px_rgba(196,93,62,.13)]")}>
              <div className="flex w-full flex-col">
                <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-semibold">{plan.name}</h3>{plan.pill ? <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", plan.plan === "free" ? "bg-[oklch(0.95_0.05_150)] text-[oklch(0.36_0.09_150)]" : "bg-nokta-accent-tint text-nokta-accent-dark")}>{plan.pill}</span> : null}</div>
                <div className="mt-4 flex items-end gap-0.5"><span className="text-[32px] font-semibold leading-none">£{plan.price}</span>{plan.price ? <span className="pb-0.5 text-[13px] text-nokta-ink-muted">/mo</span> : null}</div>
                <div className={cn("mt-4 rounded-[11px] border border-[oklch(0.9_0.02_55)] bg-[oklch(0.97_0.014_60)] px-[13px] py-3", highlighted && "border-[oklch(0.88_0.05_35)] bg-[oklch(0.96_0.035_35)] text-nokta-accent-dark")}><p className="text-sm font-semibold">{plan.band}</p><p className="mt-1 text-[12.5px] leading-[1.5]">{plan.bandNote}</p></div>
                <p className="mt-4 text-[13px] font-semibold text-nokta-accent-dark">{plan.positioning}</p>
                <ul className="mt-4 grid gap-2 text-[13.5px] leading-[1.45]">{plan.features.map((feature) => <li key={feature.text} className="flex items-start gap-2"><Check className="mt-0.5 h-3.5 w-3.5 flex-none text-clay-accent" strokeWidth={2.6} /><span>{feature.text}{feature.comingSoon ? <span className="ml-1.5 whitespace-nowrap rounded bg-nokta-page-bg px-1.5 py-0.5 text-[11px] font-semibold text-nokta-ink-muted">Coming soon</span> : null}</span></li>)}</ul>
                <PlanAction plan={plan} marketing={marketing} isCurrentPlan={isCurrentPlan} disabled={disabled} isChoosingPlan={isChoosingPlan} onChoosePlan={onChoosePlan} highlighted={highlighted} />
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-3 text-[13.5px] leading-[1.6] text-nokta-ink-muted">Bands count bookings you accepted. Declines, cancellations, no-shows and enquiries never count, and a request is never blocked or hidden from a customer because of your plan.</p>
      {marketing ? <PlanExtras /> : null}
    </section>
  );
}

function PlanAction({ plan, marketing, isCurrentPlan, disabled, isChoosingPlan, onChoosePlan, highlighted }: { plan: DisplayPlan; marketing: boolean; isCurrentPlan: boolean; disabled?: boolean; isChoosingPlan?: PaidVenuePlan | null; onChoosePlan?: (plan: PaidVenuePlan) => void; highlighted: boolean }) {
  const label = isCurrentPlan ? "Current plan" : plan.plan === "free" ? "Claim your venue" : isChoosingPlan === plan.plan ? "Opening checkout..." : `Start ${plan.name}`;
  const className = cn("mt-auto h-[42px] w-full rounded-[10px]", highlighted ? "bg-clay-accent text-white hover:bg-clay-accent-hover" : "border-nokta-border bg-white text-nokta-ink hover:bg-nokta-page-bg");
  if (marketing) return <Button asChild variant={highlighted ? "default" : "outline"} className={cn("mt-6", className)}><Link to={plan.plan === "free" ? "/discover" : `/owner/billing?plan=${plan.plan}`}>{label}</Link></Button>;
  return <Button variant={highlighted ? "default" : "outline"} className={cn("mt-6", className)} disabled={!isPaidPlan(plan.plan) || disabled || isChoosingPlan === plan.plan || isCurrentPlan} onClick={() => { if (isPaidPlan(plan.plan)) onChoosePlan?.(plan.plan); }}>{label}</Button>;
}

function PlanExtras() {
  return <div className="mt-3.5 grid gap-3.5 lg:grid-cols-[1.12fr_2fr]"><article className="rounded-[18px] bg-nokta-ink p-[22px] text-white"><p className="text-[12.5px] font-semibold uppercase tracking-[0.06em] text-white/50">Beta</p><h3 className="mt-2 text-base font-semibold">Founding venues pay nothing until March</h3><p className="mt-2 text-[13px] leading-[1.6] text-white/65">Then £24/mo for Growth, locked for a year. First 20 venues in a city.</p></article><article className="rounded-[18px] border border-nokta-border bg-white p-[22px]"><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-base font-semibold">Visibility, when you want it</h3><span className="text-xs text-nokta-ink-muted">Add on to any plan, cancel any month</span></div><div className="mt-3 grid gap-3 sm:grid-cols-2"><AddOn title="Featured in your area" price="£49/mo">Top of your area's list and the city page rail. Four slots per area, labelled Featured.</AddOn><AddOn title="Promoted offer" price="£25 each">One offer, 14 days, on Discover and your profile. You see the views and requests it drove.</AddOn></div></article></div>;
}

function AddOn({ title, price, children }: { title: string; price: string; children: React.ReactNode }) { return <div className="rounded-xl border border-nokta-border bg-nokta-page-bg/50 p-3"><div className="flex items-center justify-between gap-3"><h4 className="text-[13.5px] font-semibold">{title}</h4><span className="text-xs font-semibold">{price}</span></div><p className="mt-1.5 text-xs leading-[1.5] text-nokta-ink-muted">{children}</p></div>; }
