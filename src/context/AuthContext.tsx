import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { identifyPostHogUser, resetPostHogUser } from "@/lib/posthogClient";
import { supabase, supabaseConfigError } from "@/lib/supabase";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function ensureSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }

  return supabase;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const client = supabase;
    let mounted = true;

    void client.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          throw error;
        }

        if (mounted) {
          setUser(data.session?.user ?? null);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Driven by the resolved session rather than the signIn/signOut callbacks, so a
   * user returning with a stored session is identified too, not only one who just
   * typed a password.
   *
   * Reset fires only on a real sign-out — a transition from identified to not.
   * Calling it whenever `user` is null would throw away the anonymous id of every
   * signed-out visitor on each page load, which is the history identify() exists
   * to stitch together.
   */
  const identifiedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (identifiedUserId.current !== user.id) {
        identifyPostHogUser(user.id, user.email);
        identifiedUserId.current = user.id;
      }
      return;
    }

    if (identifiedUserId.current) {
      resetPostHogUser();
      identifiedUserId.current = null;
    }
  }, [user, isLoading]);

  const signIn = useCallback(async (email: string, password: string) => {
    const client = ensureSupabase();
    const { error } = await client.auth.signInWithPassword({ email, password });

    if (error) {
      throw error;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const client = ensureSupabase();
    const { error } = await client.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/sign-in`,
      },
    });

    if (error) {
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const client = ensureSupabase();
    const { error } = await client.auth.signOut();

    if (error) {
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [isLoading, signIn, signOut, signUp, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
