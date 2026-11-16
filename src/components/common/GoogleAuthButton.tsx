"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { authService, ADMIN_EMAIL } from "@/services/auth/authService";
import type { User } from "@supabase/supabase-js";
import { LogOut, ShieldCheck } from "lucide-react";

interface GoogleAuthButtonProps {
  className?: string;
  variant?: "header" | "card" | "banner";
  redirectTo?: string;
}

export function GoogleAuthButton({
  className = "",
  variant = "header",
  redirectTo,
}: GoogleAuthButtonProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    authService.getCurrentUser().then((u) => {
      if (mounted) setUser(u);
    });

    const unsubscribe = authService.onAuthStateChange((u) => {
      if (mounted) setUser(u);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await authService.signInWithGoogle(
        redirectTo || (typeof window !== "undefined" ? window.location.pathname : "/surveys")
      );
      if (error) {
        console.error("Sign in failed:", error);
        alert(`Google sign in error: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.reload();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isJaribAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Authenticated State
  if (user) {
    if (variant === "header") {
      return (
        <div className={`flex items-center gap-1.5 sm:gap-2 font-mono text-xs ${className}`}>
          {/* User Email Pill: hidden on narrow mobile (<640px) to prevent header crowding, visible on sm+ */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-secondary border border-border text-foreground font-bold">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="truncate max-w-[120px] md:max-w-[170px]">{user.email}</span>
            {isJaribAdmin && (
              <span className="text-[9px] bg-primary/20 text-primary border border-primary/40 px-1 uppercase shrink-0">
                Admin
              </span>
            )}
          </div>

          {/* Prominently visible Logout button with clear text on BOTH mobile and desktop */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isLoading}
            className="rounded-none h-8 px-2.5 sm:px-3 text-red-600 dark:text-red-400 border-red-500/50 bg-red-500/10 hover:bg-red-500 hover:text-white text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
            title="Log Out of Creator Account"
          >
            <LogOut className="size-3.5 shrink-0" />
            <span className="font-bold">LOGOUT</span>
          </Button>
        </div>
      );
    }

    return (
      <div className={`p-4 bg-emerald-500/10 border border-emerald-500/30 text-foreground space-y-2 ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs font-bold truncate">Authenticated as {user.email}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            disabled={isLoading}
            className="rounded-none font-mono text-xs h-8 px-3 text-red-600 dark:text-red-400 border-red-500/50 hover:bg-red-500 hover:text-white font-bold uppercase tracking-wider flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <LogOut className="size-3.5" />
            <span>LOGOUT</span>
          </Button>
        </div>
      </div>
    );
  }

  // Unauthenticated State
  // Per user instruction: "remove the sign in with google in the header since we already have it in the surveys platform"
  if (variant === "header") {
    return null;
  }

  // Card or in-page variant
  return (
    <Button
      variant="default"
      size="default"
      onClick={handleSignIn}
      disabled={isLoading}
      className={`rounded-none gap-2 font-mono text-xs uppercase tracking-wider font-bold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 w-full sm:w-auto ${className}`}
    >
      <svg className="size-4 shrink-0" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{isLoading ? "Connecting to Google..." : "Sign in with Google"}</span>
    </Button>
  );
}
