import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Heading for owner and admin pages. Same type scale as the account pages, one step
 * tighter on desktop because these are working screens, not landing pages.
 */
export function WorkspacePageHeader({ title, description, actions, back, className }: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { to: string; label: string };
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {back ? <WorkspaceBackLink to={back.to} label={back.label} /> : null}
        <h1 className={workspaceTitleClass}>{title}</h1>
        {description ? <div className="mt-2 max-w-2xl text-pretty text-[15px] leading-relaxed text-nokta-ink-muted">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

/** For pages that draw their own header band but want the same title. */
export const workspaceTitleClass = "text-balance font-brand text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-nokta-ink sm:text-[2.125rem]";

export function WorkspaceBackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="-ml-1 mb-3 inline-flex items-center gap-0.5 rounded-sm text-sm font-medium text-nokta-ink-muted transition-colors hover:text-nokta-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <ChevronLeft aria-hidden="true" className="size-4" />
      {label}
    </Link>
  );
}

/** The site's solid call to action (the navbar's Sign in button), for workspace pages. */
export const workspacePrimaryActionClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-nokta-ink px-4 text-sm font-semibold text-nokta-surface transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60";

export const workspaceSecondaryActionClass =
  "inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full border border-nokta-border bg-nokta-surface px-4 text-sm font-semibold text-nokta-ink transition-colors hover:bg-nokta-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
