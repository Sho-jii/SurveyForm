import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://igglzaqyixhpsfbwpryg.supabase.co";

// Supports both the new Supabase Publishable Key and legacy Anon Key
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type MutableCookieStore = CookieStore & {
  set: (name: string, value: string, options: CookieOptions) => void;
};

const isMutableCookieStore = (store: CookieStore): store is MutableCookieStore => {
  return "set" in store && typeof store.set === "function";
};

export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey || "dummy-key", {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (isMutableCookieStore(cookieStore)) {
              cookieStore.set(name, value, options);
            }
          });
        } catch {
          // Called from a Server Component
        }
      },
    },
  });
};
