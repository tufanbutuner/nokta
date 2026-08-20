import type { User } from "@supabase/supabase-js";

const ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string | undefined) ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdminUser(user: User | null): boolean {
  if (!user?.email) {
    return false;
  }

  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
