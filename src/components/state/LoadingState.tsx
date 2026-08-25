export function LoadingState({ message = "Loading venues..." }: { message?: string }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground shadow-sm shadow-stone-950/5">
      <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-clay-accent" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
