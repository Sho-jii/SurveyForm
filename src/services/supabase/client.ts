import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://igglzaqyixhpsfbwpryg.supabase.co";

// Supports both the new Supabase Publishable Key and legacy Anon Key
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const createClient = () => {
  if (!supabaseKey) {
    console.warn(
      "[Supabase] Neither NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY nor NEXT_PUBLIC_SUPABASE_ANON_KEY is defined."
    );
  }
  return createBrowserClient(supabaseUrl, supabaseKey || "dummy-key");
};
