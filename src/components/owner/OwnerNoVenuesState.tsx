import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ownerPrimaryActionClass, ownerSecondaryActionClass } from "@/components/owner/OwnerPageHeader";

export function OwnerNoVenuesState() {
  return (
    <section className="mx-auto max-w-2xl rounded-3xl border border-nokta-border bg-nokta-surface px-6 py-10 sm:px-10 sm:py-12">
      <h2 className="text-balance font-brand text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-nokta-ink sm:text-[2rem]">
        No claimed venues yet
        <span aria-hidden="true" className="ml-[0.06em] inline-block size-[0.22em] rounded-full bg-nokta-accent-solid" />
      </h2>
      <p className="mt-3 max-w-prose text-pretty text-[15px] leading-relaxed text-nokta-ink-muted">
        Claim an existing venue profile or list your venue to start managing bookings, enquiries and profile details on nokta.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <Link to="/" className={ownerPrimaryActionClass}>Find your venue</Link>
        <Link to="/suggest" className={ownerSecondaryActionClass}>Suggest a venue</Link>
        <Link
          to="/for-venues"
          className="ml-2 inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-nokta-ink underline decoration-nokta-accent/50 decoration-2 underline-offset-4 hover:decoration-nokta-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          nokta for venues
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
