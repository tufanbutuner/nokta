export function InlineLoadingState({ message = "Loading..." }: { message?: string }) {
  return <div className="rounded-md border bg-card px-4 py-3 text-sm text-muted-foreground">{message}</div>;
}
