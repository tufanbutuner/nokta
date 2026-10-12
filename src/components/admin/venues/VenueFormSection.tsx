export function VenueFormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-nokta-border bg-nokta-surface p-5 sm:p-6">
      <h2 className="border-b border-nokta-divider pb-4 font-brand text-lg font-semibold tracking-[-0.01em] text-nokta-ink">{title}</h2>
      <div className="mt-5 grid gap-4">{children}</div>
    </section>
  );
}
