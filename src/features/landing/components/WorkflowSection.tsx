import React from "react";
import { DecorIcon } from "@/components/ui/decor-icon";
import {
  Upload,
  Settings2,
  Share2,
  BarChart,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Drop Questionnaire PDF",
    description:
      "Upload your PDF questionnaire document. The client and server parser extracts survey sections, questions, and Likert scale matrices.",
    icon: <Upload className="size-4 text-emerald-400" />,
  },
  {
    step: "02",
    title: "Tailor Form Fields",
    description:
      "Review the parsed structure. Easily make fields optional (e.g. respondent Name) or required, customize choices, or tweak descriptions.",
    icon: <Settings2 className="size-4 text-primary" />,
  },
  {
    step: "03",
    title: "Distribute Public Link",
    description:
      "Generate an instant public URL (/s/[slug]). Anyone can open and answer on desktop or mobile with a box-styled Likert interface.",
    icon: <Share2 className="size-4 text-sky-400" />,
  },
  {
    step: "04",
    title: "Analyze & Edit Responses",
    description:
      "Watch submissions roll in live. Edit or review individual answered surveys in the dashboard and export to CSV, JSON, or PDF reports.",
    icon: <BarChart className="size-4 text-amber-400" />,
  },
];

export function WorkflowSection() {
  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-20 border-t border-border/40">
      <div className="mx-auto max-w-2xl space-y-2 text-center pb-12">
        <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
          Step-by-Step Workflow
        </span>
        <h2 className="font-heading font-bold text-3xl tracking-tight sm:text-4xl text-foreground">
          How SurveyForm Works
        </h2>
        <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
          From a static PDF document to an interactive online survey with live analytics in 4 simple steps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((item, idx) => (
          <div
            key={item.step}
            className="relative bg-card/60 border border-border/80 p-5 rounded-none flex flex-col justify-between space-y-4 hover:border-foreground/30 transition-all group"
          >
            <DecorIcon position="top-right" className="opacity-40 group-hover:opacity-100" />
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xl font-bold text-foreground/40 group-hover:text-primary transition-colors">
                  {item.step}
                </span>
                <div className="p-2 bg-secondary/50 border border-border/70 rounded-none">
                  {item.icon}
                </div>
              </div>

              <h3 className="font-heading font-semibold text-base text-foreground">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="pt-2 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest border-t border-border/30 flex items-center justify-between">
              <span>STEP {idx + 1} OF 4</span>
              {idx < 3 && <ArrowRight className="size-3 text-border group-hover:text-primary transition-colors" />}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

