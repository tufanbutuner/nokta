export function AuthError({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{message}</div>;
}
