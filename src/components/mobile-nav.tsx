"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Portal, PortalBackdrop } from "@/components/portal";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Menu, X, Sparkles, LayoutGrid, Plus, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  navLinks: Array<{ label: string; href: string; icon?: React.ReactNode }>;
}

export function MobileNav({ navLinks }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden flex items-center gap-2">
      <ThemeToggle />
      <Button
        aria-controls="mobile-menu"
        aria-expanded={open}
        aria-label="Toggle navigation menu"
        className="md:hidden rounded-none size-9 border-border bg-card/60"
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

            {/* Bottom Actions */}
            <div className="mt-8 flex flex-col gap-2.5 pt-4 border-t border-border/60 font-mono">
              <Link href="/surveys/new" onClick={() => setOpen(false)}>
                <Button className="w-full rounded-none gap-2 text-xs uppercase tracking-wider font-bold">
                  <Sparkles className="size-3.5" />
                  <span>Import PDF Survey</span>
                </Button>
              </Link>
              <Link href="/surveys" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full rounded-none text-xs uppercase tracking-wider">
                  <span>Open Survey Dashboard</span>
                </Button>
              </Link>
            </div>
          </div>
        </Portal>
      )}
    </div>
  );
}

