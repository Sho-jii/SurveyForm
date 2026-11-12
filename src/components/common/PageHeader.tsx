import React from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  badge,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6 mb-8 w-full max-w-full min-w-0",
        className
      )}
    >
      <div className="space-y-1.5 w-full min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 max-w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight text-foreground font-heading break-words max-w-full">
            {title}
          </h1>
          {badge && <div className="shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="text-xs sm:text-sm md:text-base text-muted-foreground max-w-2xl break-words">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

