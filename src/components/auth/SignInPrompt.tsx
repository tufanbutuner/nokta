import { Link, useLocation } from "react-router-dom";
import { AuthShell } from "@/components/auth/AuthShell";
import { authLinkClass, authSubmitClass } from "@/components/auth/AuthField";
import { withRedirect } from "@/lib/authRedirect";

/** Shown in place of a page that needs an account; sign-in returns here afterwards. */
export function SignInPrompt({ title = "Sign in to continue", description }: { title?: string; description?: string }) {
  const location = useLocation();
  const here = `${location.pathname}${location.search}`;

  return (
    <main>
      <AuthShell
        title={title}
        description={description ?? "This page belongs to your nokta account. Sign in and we'll bring you straight back."}
        footer={
          <p>
            New to nokta?{" "}
            <Link to={withRedirect("/sign-up", here)} className={authLinkClass}>
              Create an account
            </Link>
          </p>
        }
      >
        <Link to={withRedirect("/sign-in", here)} className={authSubmitClass}>
          Sign in
        </Link>
      </AuthShell>
    </main>
  );
}
