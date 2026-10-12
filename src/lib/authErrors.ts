/**
 * Supabase auth errors are written for developers ("Invalid login credentials").
 * Map the ones people actually hit to copy that names the problem and the way out.
 */
export function describeAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  const normalised = message.toLowerCase();

  if (normalised.includes("invalid login credentials")) {
    return "That email and password don't match. Check for typos, or reset your password.";
  }
  if (normalised.includes("email not confirmed")) {
    return "Confirm your email first. We sent a link when you created your account.";
  }
  if (normalised.includes("user already registered")) {
    return "There's already an account with that email. Sign in instead.";
  }
  if (normalised.includes("rate limit") || normalised.includes("security purposes")) {
    return "Too many attempts. Wait a minute, then try again.";
  }
  if (normalised.includes("same as the old") || normalised.includes("different from the old")) {
    return "Choose a password you haven't used here before.";
  }
  if (normalised.includes("password should be")) {
    return "Use at least 8 characters for your password.";
  }
  if (normalised.includes("failed to fetch") || normalised.includes("network")) {
    return "We couldn't reach nokta. Check your connection and try again.";
  }

  return message || "Something went wrong. Please try again.";
}
