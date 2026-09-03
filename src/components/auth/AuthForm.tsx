import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthError } from "@/components/auth/AuthError";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  email: string;
  password: string;
  confirmPassword?: string;
  error: string | null;
  isSubmitting: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange?: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function AuthForm({
  mode,
  email,
  password,
  confirmPassword,
  error,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: AuthFormProps) {
  const signingUp = mode === "sign-up";

  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="space-y-6 p-6">
        <div>
          <p className="text-sm text-muted-foreground">{signingUp ? "Create account" : "Welcome back"}</p>
          <h1 className="mt-2 text-3xl font-semibold">{signingUp ? "Create your nokta account" : "Sign in to nokta"}</h1>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">
              Email
            </label>
            <Input id="email" type="email" autoComplete="email" value={email} onChange={(event) => onEmailChange(event.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="password">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete={signingUp ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => onPasswordChange(event.target.value)}
            />
          </div>

          {signingUp ? (
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="confirm-password">
                Confirm password
              </label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => onConfirmPasswordChange?.(event.target.value)}
              />
            </div>
          ) : null}

          <AuthError message={error} />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Please wait..." : signingUp ? "Create account" : "Sign in"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          {signingUp ? (
            <Link to="/sign-in" className="text-foreground hover:underline">
              Already have an account? Sign in
            </Link>
          ) : (
            <Link to="/sign-up" className="text-foreground hover:underline">
              Create account
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
