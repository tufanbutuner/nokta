export function ErrorState({ title = "Could not load venues", message = "Please try again." }: { title?: string; message?: string }) {
  return (
    <div className="rounded-lg border bg-card p-10 text-center">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{message}</p>
    </div>
  );
}
