import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { PageContainer } from "@/components/layout/PageContainer";
import { useAuth } from "@/context/AuthContext";

export function SignUpPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 8) {
      setError("Password should be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Confirm password must match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password);
      navigate("/account");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <PageContainer className="py-12">
        <AuthForm
          mode="sign-up"
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          error={error}
          isSubmitting={isSubmitting}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onSubmit={handleSubmit}
        />
      </PageContainer>
    </main>
  );
}
