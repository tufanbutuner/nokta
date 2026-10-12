import type { ReactNode } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { cn } from "@/lib/utils";

const ACCOUNT_PERKS = [
  "Saved venues follow you from phone to laptop.",
  "Booking requests show each venue's reply as it lands.",
  "Group shortlists, reviews and enquiries stay in one place.",
] as const;

/**
 * The frame every auth step shares: the task on the left, and on wide screens a
 * quiet ink panel saying what an account is for. Mobile gets the task alone,
 * starting near the top so the keyboard never covers the submit button.
 */
export function AuthShell({ title, description, children, footer, showPerks = true }: {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  showPerks?: boolean;
}) {
  return (
    <PageContainer className="py-8 sm:py-14 lg:py-16">
      <div className={cn("mx-auto grid max-w-5xl items-stretch gap-10", showPerks ? "lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16" : "max-w-md")}>
        <div className="w-full max-w-md">
          <h1 className="text-balance font-brand text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] text-nokta-ink sm:text-[2.5rem]">{title}</h1>
          {description ? <div className="mt-3 text-pretty text-base leading-relaxed text-nokta-ink-muted">{description}</div> : null}
          <div className="mt-8">{children}</div>
          {footer ? <div className="mt-10 border-t border-nokta-border pt-6 text-sm text-nokta-ink-muted">{footer}</div> : null}
        </div>

        {showPerks ? (
          <aside aria-label="What a nokta account does" className="hidden rounded-3xl bg-nokta-footer p-10 text-clay-50 lg:flex lg:flex-col lg:justify-between">
            {/* Ends on a clay dot, like the wordmark. */}
            <p className="max-w-[14ch] font-brand text-4xl font-bold leading-[1.05] tracking-[-0.02em]">
              Your shortlist, wherever you are
              <span aria-hidden="true" className="ml-[0.06em] inline-block size-[0.22em] rounded-full bg-nokta-accent-solid" />
              <span className="sr-only">.</span>
            </p>
            <ul className="mt-16 max-w-sm space-y-5">
              {ACCOUNT_PERKS.map((perk) => (
                <li key={perk} className="flex gap-3 text-[15px] leading-relaxed text-clay-50/80">
                  <span aria-hidden="true" className="mt-[0.6em] size-1.5 shrink-0 rounded-full bg-nokta-accent-solid" />
                  {perk}
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </PageContainer>
  );
}
