import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "cn-badge inline-flex items-center whitespace-nowrap rounded-none border px-2 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "cn-badge-variant-default border-transparent bg-primary text-primary-foreground shadow",
        secondary: "cn-badge-variant-secondary border-transparent bg-secondary text-secondary-foreground",
        destructive: "cn-badge-variant-destructive border-transparent bg-destructive text-destructive-foreground shadow",
        outline: "cn-badge-variant-outline text-foreground border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
