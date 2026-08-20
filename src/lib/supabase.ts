import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string | undefined;

export const supabaseConfigError = !supabaseUrl || !supabaseKey ? "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY or VITE_SUPABASE_PUBLISHABLE_KEY to your .env.local file." : null;

export const supabase: SupabaseClient | null = supabaseUrl && supabaseKey && !supabaseConfigError ? createClient(supabaseUrl, supabaseKey) : null;
