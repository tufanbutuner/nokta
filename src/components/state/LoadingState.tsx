export function LoadingState({ message = "Loading venues..." }: { message?: string }) {
  return (
    <div className="rounded-lg border border-nokta-border bg-white p-8 text-center text-sm text-nokta-ink-muted shadow-sm shadow-stone-950/5">
      <div className="relative mx-auto mb-4 h-12 w-12" aria-hidden="true">
        <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nokta-accent" />
        <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-nokta-accent opacity-70 animate-[noktaPulse_1.4s_ease-out_infinite]" />
      </div>
      <p>{message}</p>
    </div>
  );
}
