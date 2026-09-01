import { BarChart3, CalendarCheck, Camera, Megaphone } from "lucide-react";

const ownerValues = [
  {
    title: "Get discovered",
    description: "Appear in a focused venue discovery product built for people choosing where to go out.",
    Icon: Camera,
  },
  {
    title: "Look trustworthy",
    description: "Present accurate details, original photos, categories, opening hours and contact links in one profile.",
    Icon: CalendarCheck,
  },
  {
    title: "Convert interest",
    description: "Turn profile views into booking requests and enquiries instead of losing demand in DMs.",
    Icon: BarChart3,
  },
  {
    title: "Grow visibility",
    description: "Request promoted offers, featured placements and use analytics when your venue is ready to grow.",
    Icon: Megaphone,
  },
];

export function OwnerValueCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {ownerValues.map(({ title, description, Icon }) => (
        <article key={title} className="relative isolate overflow-hidden rounded-2xl border border-nokta-border bg-white p-5 shadow-sm shadow-stone-950/5">
          <img
            src="/nokta-dot.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-9 -z-10 h-32 w-32 opacity-[0.07]"
          />
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-nokta-accent-tint text-nokta-accent-dark">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="mt-5 text-base font-semibold text-nokta-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-nokta-ink-muted">{description}</p>
        </article>
      ))}
    </div>
  );
}
