import { Link, useSearchParams } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { PageContainer } from "@/components/layout/PageContainer";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";

export function AccountConfirmationPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("checkEmail");

  return (
    <main>
      <PageMeta title="Confirm your email | nokta" description="Confirm your email address to finish creating your nokta account." canonicalPath="/account" />
      <PageContainer className="py-12 sm:py-16">
        <section className="mx-auto max-w-2xl rounded-xl border bg-card p-6 text-center shadow-sm sm:p-8">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <MailCheck className="h-6 w-6" />
          </span>
          <p className="mt-5 text-sm font-semibold text-clay-accent">Almost there</p>
          <h1 className="mt-2 font-brand text-3xl font-bold tracking-[-0.5px]">Check your email to confirm your account</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
            We sent a confirmation link{email ? ` to ${email}` : ""}. Open that email and confirm your address, then sign in to use saved venues, reviews, bookings and owner tools.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link to="/sign-in">Go to sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/">Back to nokta</Link>
            </Button>
          </div>
        </section>
      </PageContainer>
    </main>
  );
}
