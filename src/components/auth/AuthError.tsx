import type { ReactNode } from "react";

export function AuthError({ message, children }: { message: string | null; children?: ReactNode }) {
  if (!message) {
    return null;
  }

  return (
    <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm leading-relaxed text-destructive">
      {message}
      {children}
    </div>
  );
}
