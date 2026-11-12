import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DecorIcon } from "@/components/ui/decor-icon";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  className,
}: MetricCardProps) {
  return (
    <Card
      className={cn(
        "relative rounded-none border border-border/80 bg-card/90 shadow-none transition-all hover:border-foreground/40 group overflow-hidden",
        className
      )}
    >
      <DecorIcon position="top-right" className="opacity-40 group-hover:opacity-100 transition-opacity" />
      
      {/* Corner crosshair guideline accent */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-primary/40 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-border/60 pointer-events-none" />

      <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-widest">
            {title}
          </span>
          {icon && (
            <div className="p-2 rounded-none bg-muted/40 border border-border/70 text-muted-foreground group-hover:text-foreground group-hover:border-border transition-colors">
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-2xl md:text-3xl font-bold tracking-tight text-foreground font-heading font-mono">
            {value}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 pt-0.5">
            {trend && (
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-none">
                {trend}
              </span>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground leading-tight">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
