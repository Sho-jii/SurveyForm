import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DecorIcon } from "@/components/ui/decor-icon";
import { FileQuestion } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  actionText,
  onAction,
  icon,
}: EmptyStateProps) {
  return (
    <Card className="relative border-dashed border-border/80 bg-card/40 my-6 rounded-none">
      <DecorIcon position="top-left" />
      <DecorIcon position="bottom-right" />
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        <div className="p-4 rounded-none bg-secondary/40 border border-border/70 text-muted-foreground mb-4">
          {icon || <FileQuestion className="w-8 h-8 text-primary" />}
        </div>
        <h3 className="text-base font-semibold text-foreground mb-1 font-heading uppercase tracking-wide">{title}</h3>
        <p className="text-xs text-muted-foreground max-w-sm mb-6 leading-relaxed">{description}</p>
        {actionText && onAction && (
          <Button onClick={onAction} variant="default" size="default" className="rounded-none font-mono text-xs uppercase tracking-wider">
            {actionText}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
