import { Link, useSearchParams } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
import { workspacePrimaryActionClass, workspaceSecondaryActionClass } from "@/components/workspace/WorkspacePageHeader";
import { PageMeta } from "@/components/seo/PageMeta";
import { trackEvent } from "@/lib/analytics";
import { useEffect } from "react";

export function OwnerBillingSuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    trackEvent("owner_checkout_success_viewed", { sessionId: sessionId ? "present" : "missing" });
  }, [sessionId]);

  return (
    <OwnerLayout>
      <PageMeta title="Payment successful | nokta" description="Your nokta venue plan payment was successful." canonicalPath="/owner/billing/success" />
      <section className="mx-auto max-w-2xl rounded-3xl border border-nokta-border bg-nokta-surface px-6 py-10 sm:px-10 sm:py-12">
        <span className="flex size-12 items-center justify-center rounded-full bg-nokta-ok-tint text-nokta-ok-ink">
          <CircleCheck aria-hidden="true" className="size-6" />
        </span>
        <h1 className="mt-6 text-balance font-brand text-[1.75rem] font-bold leading-[1.1] tracking-[-0.02em] text-nokta-ink sm:text-[2.125rem]">Payment successful</h1>
        <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-nokta-ink-muted">Your payment was successful. Your plan will update automatically once Stripe confirms the subscription.</p>
        <div className="mt-8 flex flex-wrap gap-2">
          <Link to="/owner" className={workspacePrimaryActionClass}>Owner home</Link>
          <Link to="/owner/billing" className={workspaceSecondaryActionClass}>Plan &amp; billing</Link>
        </div>
      </section>
    </OwnerLayout>
  );
}
