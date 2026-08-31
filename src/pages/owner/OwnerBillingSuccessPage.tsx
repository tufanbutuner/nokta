import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OwnerLayout } from "@/components/owner/OwnerLayout";
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
      <section className="max-w-2xl rounded-xl border bg-card p-8">
        <CheckCircle2 className="h-10 w-10 text-clay-500" />
        <h1 className="mt-5 font-brand text-3xl font-bold tracking-[-0.5px]">Payment successful</h1>
        <p className="mt-3 text-muted-foreground">Your payment was successful. Your plan will update automatically once Stripe confirms the subscription.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild><Link to="/owner">Owner dashboard</Link></Button>
          <Button asChild variant="outline"><Link to="/owner/billing">Billing</Link></Button>
        </div>
      </section>
    </OwnerLayout>
  );
}
