import { createClient, isSupabaseConfigured } from "@/services/supabase/client";
import { Survey } from "@/features/surveys/types";
import { deviceSessionService } from "@/services/session/deviceSessionService";
import type { User } from "@supabase/supabase-js";

export const ADMIN_EMAIL = "siocojarib@gmail.com";

export const authService = {
  /**
   * Initiate Google OAuth sign in
   */
  async signInWithGoogle(redirectTo?: string): Promise<{ error: Error | null }> {
    if (!isSupabaseConfigured) {
      return { error: new Error("Supabase is not configured.") };
    }
    const supabase = createClient();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const callbackUrl = `${origin}/auth/callback?next=${encodeURIComponent(redirectTo || "/surveys")}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    return { error };
  },

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();
    await supabase.auth.signOut();
  },

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured) return null;
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (e) {
      console.warn("Failed to retrieve current user:", e);
      return null;
    }
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: User | null) => void) {
    if (!isSupabaseConfigured) {
      callback(null);
      return () => {};
    }
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user || null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  },

  /**
   * Determines whether the user or device is authorized to manage the survey.
   * Rules:
   * 1. If user is logged in as siocojarib@gmail.com -> Full Admin access to all surveys, especially HITOVIS.
   * 2. If survey has creator_email / schema.settings.creatorEmail, only that matching email can manage it.
   * 3. Fallback: If no creator_email is set, check deviceSessionService.isOwner.
   */
  isSurveyManager(survey: Survey | null | undefined, user: User | null): boolean {
    if (!survey) return false;

    const creatorEmail = (
      survey.creator_email ||
      survey.schema?.settings?.creatorEmail ||
      ""
    ).toLowerCase().trim();

    const userEmail = (user?.email || "").toLowerCase().trim();

    // Admin master override
    if (userEmail === ADMIN_EMAIL.toLowerCase()) {
      return true;
    }

    // Email-based ownership check
    if (creatorEmail) {
      return userEmail === creatorEmail;
    }

    // Device session fallback for offline or legacy drafts
    const creatorDeviceId = survey.schema?.settings?.creatorDeviceId || survey.creator_device_id;
    return deviceSessionService.isOwner(survey.id, creatorDeviceId);
  },
};

