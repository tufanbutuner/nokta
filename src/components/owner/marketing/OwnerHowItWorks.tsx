const ownerSteps = [
  ["Find your venue", "Search for your existing venue profile on Nokta."],
  ["Submit a claim request", "Tell us who you are and how you are connected to the venue."],
  ["Get approved", "The Nokta team reviews the request to protect venue profiles."],
  ["Become booking-ready", "Add photos, check details, configure availability and start managing requests."],
] as const;

export function OwnerHowItWorks() {
  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {ownerSteps.map(([title, description], index) => (
        <article key={title} className="relative isolate overflow-hidden rounded-2xl border border-nokta-border bg-white p-5">
          <img
            src="/nokta-dot.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 -right-9 -z-10 h-32 w-32 opacity-[0.07]"
          />
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-nokta-ink text-sm font-semibold text-white">
            {index + 1}
          </span>
          <h3 className="mt-5 font-semibold text-nokta-ink">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-nokta-ink-muted">{description}</p>
        </article>
      ))}
    </div>
  );
}
