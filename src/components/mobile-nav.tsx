"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Portal, PortalBackdrop } from "@/components/portal";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { BrandLogo } from "@/components/common/BrandLogo";
import { GoogleAuthButton } from "@/components/common/GoogleAuthButton";
import { authService } from "@/services/auth/authService";
import type { User } from "@supabase/supabase-js";
import { Menu, X, Sparkles, LayoutGrid, Plus, Home, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  navLinks: Array<{ label: string; href: string; icon?: React.ReactNode }>;
}

export function MobileNav({ navLinks }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

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

  const handleMobileSignOut = async () => {
    setOpen(false);
    await authService.signOut();
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="md:hidden flex items-center gap-1.5 sm:gap-2">
      <ThemeToggle />
      {/* Prominent Logout Button on mobile bar when authenticated */}
      <GoogleAuthButton variant="header" />

      <Button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label="Toggle navigation menu"
        className="rounded-none size-9 border-border bg-card/60 p-0"
        onClick={() => setOpen(!open)}
        size="icon"
        variant="outline"
      >
        {open ? <X className="size-4 text-foreground" /> : <Menu className="size-4 text-foreground" />}
      </Button>

      {open && (
        <Portal className="top-14" id="mobile-menu">
          <PortalBackdrop onClick={() => setOpen(false)} />
          <div
            className={cn(
              "data-[slot=open]:zoom-in-95 ease-out data-[slot=open]:animate-in",
              "w-full max-w-full h-[calc(100dvh-3.5rem)] p-4 sm:p-5 flex flex-col justify-between rounded-none bg-background/98 backdrop-blur-xl border-b border-border shadow-2xl overflow-y-auto min-w-0"
            )}
            data-slot={open ? "open" : "closed"}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <BrandLogo size="sm" />
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Navigation
                </span>
              </div>

              {/* Navigation Links */}
              <div className="grid gap-y-1 font-mono">
                {navLinks.map((link) => {
                  const active =
                    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

                  return (
                    <Button
                      asChild
                      key={link.label}
                      className={cn(
                        "justify-start rounded-none h-11 text-xs uppercase tracking-wider font-semibold gap-2.5",
                        active
                          ? "bg-primary text-primary-foreground font-bold border-l-4 border-primary-foreground"
                          : "hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                      )}
                      variant="ghost"
                      onClick={() => setOpen(false)}
                    >
                      <Link href={link.href}>
                        {link.icon}
                        <span>{link.label}</span>
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions & User Session */}
            <div className="mt-8 flex flex-col gap-2.5 pt-4 border-t border-border/60 font-mono">
              {user && (
                <div className="p-3 bg-secondary/50 border border-border/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-foreground font-bold truncate">{user.email}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleMobileSignOut}
                    className="w-full rounded-none h-9 text-red-600 dark:text-red-400 border-red-500/50 bg-red-500/10 hover:bg-red-500 hover:text-white font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2"
                  >
                    <LogOut className="size-3.5" />
                    <span>LOGOUT ACCOUNT</span>
                  </Button>
                </div>
              )}

              <Link href="/surveys/new" onClick={() => setOpen(false)}>
                <Button className="w-full rounded-none gap-2 text-xs uppercase tracking-wider font-bold">
                  <Sparkles className="size-3.5" />
                  <span>Import PDF Survey</span>
                </Button>
              </Link>
              <Link href="/surveys" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full rounded-none text-xs uppercase tracking-wider">
                  <span>Open Survey Directory</span>
                </Button>
              </Link>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}
