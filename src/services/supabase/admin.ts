import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://igglzaqyixhpsfbwpryg.supabase.co";

// Supports both the new Supabase Secret Key and legacy Service Role Key
const serviceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "";

export const isSupabaseAdminConfigured = Boolean(supabaseUrl && serviceKey);

export const createAdminClient = () => {
  if (!serviceKey) {
    console.warn("[Supabase] Neither SUPABASE_SECRET_KEY nor SUPABASE_SERVICE_ROLE_KEY is configured.");
  }
  return createClient(supabaseUrl, serviceKey || "dummy-service-key", {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
