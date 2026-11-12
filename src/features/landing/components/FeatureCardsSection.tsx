import React from "react";
import { cn } from "@/lib/utils";
import { DecorIcon } from "@/components/ui/decor-icon";
import {
  FileText,
  SlidersHorizontal,
  BarChart3,
  FileCheck2,
} from "lucide-react";

type FeatureType = {
  title: string;
  icon: React.ReactNode;
  description: string;
  badge: string;
};

export function FeatureCardsSection() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-20">
      <div className="mx-auto max-w-2xl space-y-2 text-center pb-12">
        <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
          Platform Architecture
        </span>
        <h2 className="font-heading font-bold text-3xl tracking-tight sm:text-4xl md:text-5xl text-foreground">
          Built for Universal Survey Workflows
        </h2>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          From complex multi-part academic evaluation matrices to lightweight customer questionnaires,
          tailor every aspect with a box-first brutalist interface.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <FeatureCard feature={feature} key={feature.title} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  feature: FeatureType;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between gap-6 bg-card/70 border border-border/70 p-6 shadow-none transition-all hover:border-foreground/40 group",
        "dark:bg-[radial-gradient(60%_90%_at_25%_0%,oklch(0.985_0_0_/_0.06),transparent)]",
        className
      )}
      {...props}
    >
      {/* Extended Borders */}
      <div className="absolute -inset-y-4 -left-px w-px bg-border/40 pointer-events-none hidden md:block" />
      <div className="absolute -inset-y-4 -right-px w-px bg-border/40 pointer-events-none hidden md:block" />
      <div className="absolute -inset-x-4 -top-px h-px bg-border/40 pointer-events-none hidden md:block" />
      <div className="absolute -right-4 -bottom-px -left-4 h-px bg-border/40 pointer-events-none hidden md:block" />

      {/* Corner Decor Crosshair */}
      <DecorIcon className="size-3.5 opacity-60 group-hover:opacity-100 transition-opacity" position="top-left" />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "relative z-10 flex size-10 items-center justify-center rounded-none border border-border/80 bg-secondary/50 p-2 text-foreground",
              "[&_svg]:size-5 [&_svg]:stroke-[1.5] group-hover:border-primary/50 group-hover:text-primary transition-colors"
            )}
          >
            {feature.icon}
          </div>
          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 border border-border/60 text-muted-foreground bg-muted/30">
            {feature.badge}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="font-heading font-semibold text-base text-foreground tracking-tight">
            {feature.title}
          </h3>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {feature.description}
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
        <span>EFF-SPEC</span>
        <span className="text-emerald-400">ACTIVE</span>
      </div>
    </div>
  );
}

const features: FeatureType[] = [
  {
    title: "Instant PDF Parsing",
    badge: "AI-ENGINE",
    icon: <FileText />,
    description:
      "Automatically extracts multi-page questionnaires, table matrices, Likert 1–5 scales, and metadata directly from uploaded PDF files into clean JSON structures.",
  },
  {
    title: "Universal Field Tailoring",
    badge: "CONFIGURABLE",
    icon: <SlidersHorizontal />,
    description:
      "Full creator flexibility: toggle required or optional for all fields with 1 click, or configure individual fields (such as making respondent Name optional).",
  },
  {
    title: "Live Likert Analytics",
    badge: "REAL-TIME",
    icon: <BarChart3 />,
    description:
      "Automated evaluation metrics including ISO/IEC 25010 dimension means, UTAUT score aggregation, verbal interpretations, and stakeholder role distributions.",
  },
  {
    title: "Edit & Audit Responses",
    badge: "MANAGEMENT",
    icon: <FileCheck2 />,
    description:
      "Inspect submitted questionnaires in a filterable table, correct or modify recorded answers post-submission, and export to CSV, JSON, or formal PDF reports.",
  },
];

