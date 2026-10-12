export function ErrorState({ title = "Could not load venues", message = "Please try again." }: { title?: string; message?: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-nokta-border bg-nokta-surface px-6 py-10 text-center">
      <h1 className="font-brand text-2xl font-bold tracking-[-0.01em] text-nokta-ink">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-nokta-ink-muted">{message}</p>
    </div>
  );
}
