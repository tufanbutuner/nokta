import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

/** Heading for pages under /account, with a way back to the account hub. */
export function AccountPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link
          to="/account"
          className="-ml-1 mb-3 inline-flex items-center gap-0.5 rounded-sm text-sm font-medium text-nokta-ink-muted transition-colors hover:text-nokta-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft aria-hidden="true" className="size-4" />
          Account
        </Link>
        <h1 className="font-brand text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-nokta-ink sm:text-[2.5rem]">{title}</h1>
        {description ? <p className="mt-2 text-base text-nokta-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </div>
  );
}
