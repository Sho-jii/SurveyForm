"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  showBadge?: boolean;
  className?: string;
  href?: string;
}

export function BrandLogo({
  size = "md",
  showText = true,
  showBadge = true,
  className,
  href = "/",
}: BrandLogoProps) {
  const iconDimensions = {
    sm: { px: 24, boxClass: "size-6" },
    md: { px: 32, boxClass: "size-8" },
    lg: { px: 44, boxClass: "size-11" },
  }[size];

  const content = (
    <div className={cn("inline-flex items-center gap-2.5 group", className)}>
      {/* Brutalist Logo Icon Container */}
      <div
        className={cn(
          "rounded-none border border-primary/40 bg-card flex items-center justify-center shadow-sm group-hover:border-primary transition-all overflow-hidden shrink-0",
          iconDimensions.boxClass
        )}
      >
        <Image
          src="/icons/brand-logo.png"
          alt="SurveyForm Logo"
          width={iconDimensions.px}
          height={iconDimensions.px}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      {/* Brand Name */}
      {showText && (
        <span
          className={cn(
            "font-heading font-bold tracking-tight text-foreground leading-normal",
            size === "sm" ? "text-xs" : size === "lg" ? "text-base sm:text-lg" : "text-sm"
          )}
        >
          SurveyForm
        </span>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

