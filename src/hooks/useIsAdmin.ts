import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { isAdminUser } from "@/lib/admin";
import { supabase } from "@/lib/supabase";

interface UseIsAdminResult {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useIsAdmin(): UseIsAdminResult {
  const { user, isLoading: authIsLoading } = useAuth();
  const allowlistedByEmail = useMemo(() => isAdminUser(user), [user]);
  const [hasAdminRecord, setHasAdminRecord] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authIsLoading || !user || allowlistedByEmail || !supabase) {
      setHasAdminRecord(false);
      setIsLoadingRecord(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoadingRecord(true);
    setError(null);

    async function checkAdminRecord() {
      try {
        const { data, error: adminError } = await supabase!.from("admin_users").select("user_id").eq("user_id", user!.id).maybeSingle();

        if (adminError) {
          throw adminError;
        }

        if (!cancelled) {
          setHasAdminRecord(Boolean(data));
        }
      } catch (caughtError) {
        if (!cancelled) {
          setHasAdminRecord(false);
          setError(caughtError instanceof Error ? caughtError.message : "Could not check admin access.");
        }
      } finally {
        if (!cancelled) {
          setIsLoadingRecord(false);
        }
      }
    }

    void checkAdminRecord();

    return () => {
      cancelled = true;
    };
  }, [allowlistedByEmail, authIsLoading, user]);

  return {
    isAdmin: Boolean(user && (allowlistedByEmail || hasAdminRecord)),
    isLoading: authIsLoading || isLoadingRecord,
    error,
  };
}
