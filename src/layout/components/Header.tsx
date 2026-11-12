"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { BrandLogo } from "@/components/common/BrandLogo";
import { MobileNav } from "@/components/mobile-nav";
import { useScroll } from "@/hooks/use-scroll";
import { Sparkles, LayoutGrid, Plus, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export const navLinks = [
  { label: "Home", href: "/", icon: <Home className="w-3.5 h-3.5 mr-1" /> },
  { label: "Surveys", href: "/surveys", icon: <LayoutGrid className="w-3.5 h-3.5 mr-1" /> },
  { label: "Create Survey", href: "/surveys/new", icon: <Plus className="w-3.5 h-3.5 mr-1" /> },
];

/**
 * Header Component implementing @efferd/header-2
 * Strict 0 radius (zero border-radius) brutalist box design.
 */
export function Header() {
  const scrolled = useScroll(10);
  const pathname = usePathname();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-6xl border-transparent border-b transition-all duration-200 ease-out rounded-none min-w-0",
        scrolled
          ? "border-border bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/70 md:top-2 md:max-w-5xl md:border md:shadow-lg rounded-none"
          : "border-b border-border/60 bg-background/90 backdrop-blur-sm"
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-3 sm:px-4 transition-all duration-200 ease-out rounded-none min-w-0",
          scrolled ? "md:h-12 md:px-3" : "md:h-14 md:px-4"
        )}
      >
        {/* Left: Brand Logo (Radius 0) */}
        <div className="flex items-center gap-6">
          <BrandLogo size="md" href="/" />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 font-mono text-xs">
            {navLinks.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);

              return (
                <Button
                  asChild
                  key={link.label}
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "rounded-none h-8 px-2.5 uppercase tracking-wider text-xs transition-colors",
                    active
                      ? "bg-secondary text-foreground font-bold border-b-2 border-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
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

        {/* Right Controls: Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Button
            asChild
            size="sm"
            className="rounded-none gap-1.5 font-mono text-xs uppercase tracking-wider font-bold h-8"
          >
            <Link href="/surveys/new">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Import PDF Survey</span>
            </Link>
          </Button>
        </div>

        {/* Right Controls: Mobile Drawer Nav */}
        <MobileNav navLinks={navLinks} />
      </nav>
    </header>
  );
}
