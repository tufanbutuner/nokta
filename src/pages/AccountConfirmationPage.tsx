import { Link, useSearchParams } from "react-router-dom";
import { authLinkClass } from "@/components/auth/AuthField";
import { AuthShell } from "@/components/auth/AuthShell";
import { CheckEmailPanel } from "@/components/auth/CheckEmailPanel";
import { PageMeta } from "@/components/seo/PageMeta";
import { useAuth } from "@/context/AuthContext";

export function AccountConfirmationPage() {
  const [searchParams] = useSearchParams();
  const { resendConfirmation } = useAuth();
  const email = searchParams.get("checkEmail") || null;

  return (
    <main>
      <PageMeta title="Confirm your email | nokta" description="Confirm your email address to finish creating your nokta account." canonicalPath="/account" />
      <AuthShell
        title="Check your email"
        showPerks={false}
        footer={
          <p>
            Confirmed already?{" "}
            <Link to="/sign-in" className={authLinkClass}>
              Sign in
            </Link>
          </p>
        }
      >
        <CheckEmailPanel email={email} onResend={email ? () => resendConfirmation(email) : undefined}>
          Open the link in that email to confirm your address, then sign in to use saved venues, bookings and owner tools.
        </CheckEmailPanel>
      </AuthShell>
    </main>
  );
}
