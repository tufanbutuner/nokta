export function LoadingState({ message = "Loading venues..." }: { message?: string }) {
  return <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">{message}</div>;
}
