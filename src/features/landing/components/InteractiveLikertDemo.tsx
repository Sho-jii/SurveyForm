"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { DecorIcon } from "@/components/ui/decor-icon";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const demoCriteria = [
  {
    code: "FS1",
    label: "Functional Completeness",
    description: "The degree to which the set of features covers all specified aquaculture monitoring tasks.",
  },
  {
    code: "PE1",
    label: "Performance Efficiency",
    description: "Response and processing times meet operational requirements under typical telemetry loads.",
  },
  {
    code: "US1",
    label: "Usability & Accessibility",
    description: "Interface components are intuitive, easy to operate, and provide clear sensory feedback.",
  },
];

const scaleLabels: Record<number, string> = {
  1: "Strongly Disagree",
  2: "Disagree",
  3: "Moderately Agree",
  4: "Agree",
  5: "Strongly Agree",
};

export function InteractiveLikertDemo() {
  const [ratings, setRatings] = useState<Record<string, number>>({
    FS1: 5,
    PE1: 4,
    US1: 5,
  });

  const scores = Object.values(ratings);
  const meanScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : "0.00";

  const getInterpretation = (score: number) => {
    if (score >= 4.5) return { text: "Outstanding / Excellent Quality", color: "text-emerald-400" };
    if (score >= 3.5) return { text: "High Quality / Acceptable", color: "text-primary" };
    if (score >= 2.5) return { text: "Moderately Acceptable", color: "text-amber-400" };
    return { text: "Needs Improvement", color: "text-rose-400" };
  };

  const interp = getInterpretation(parseFloat(meanScore));

  return (
    <section className="relative mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-20 border-t border-border/40">
      <div className="mx-auto max-w-2xl space-y-2 text-center pb-10">
        <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
          Live Interactive Preview
        </span>
        <h2 className="font-heading font-bold text-3xl tracking-tight sm:text-4xl text-foreground">
          Experience the Respondent Box UI
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Click any rating below to test the instant Likert matrix calculations and zero-radius respondent experience.
        </p>
      </div>

      <div className="relative border border-border/80 bg-card/70 p-6 md:p-8 rounded-none shadow-xl">
        <DecorIcon position="top-left" className="opacity-70" />
        <DecorIcon position="top-right" className="opacity-70" />
        <DecorIcon position="bottom-left" className="opacity-70" />
        <DecorIcon position="bottom-right" className="opacity-70" />

        {/* Top Header Row with Live Score */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-primary font-semibold uppercase">
                PART 1: ISO/IEC 25010 EVALUATION
              </span>
              <Badge variant="outline" className="text-[10px] rounded-none font-mono border-primary/30 text-primary">
                INTERACTIVE DEMO
              </Badge>
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground mt-1">
              Software Quality Matrix (5-Point Likert)
            </h3>
          </div>

          <div className="flex items-center gap-3 bg-secondary/40 border border-border/60 p-3 rounded-none">
            <div className="text-right">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                Calculated Mean
              </span>
              <span className={`text-xl font-bold font-mono ${interp.color}`}>
                {meanScore} / 5.0
              </span>
            </div>
            <div className="border-l border-border/50 pl-3">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                Rating
              </span>
              <span className={`text-xs font-semibold ${interp.color}`}>
                {interp.text}
              </span>
            </div>
          </div>
        </div>

        {/* Criteria Questions */}
        <div className="divide-y divide-border/40 pt-2">
          {demoCriteria.map((item) => {
            const selectedVal = ratings[item.code];

            return (
              <div key={item.code} className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div>
                    <span className="font-mono text-xs text-primary font-bold mr-2">
                      [{item.code}]
                    </span>
                    <span className="font-medium text-sm text-foreground">
                      {item.label}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                  {selectedVal && (
                    <span className="text-xs font-mono text-emerald-400 shrink-0 font-medium">
                      Selected: {selectedVal} ({scaleLabels[selectedVal]})
                    </span>
                  )}
                </div>

                {/* 5-Point Box Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((val) => {
                    const isSelected = selectedVal === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setRatings((prev) => ({ ...prev, [item.code]: val }))}
                        className={cn(
                          "p-2 rounded-none border text-center transition-all cursor-pointer flex sm:flex-col items-center justify-between sm:justify-center gap-1 min-h-[50px]",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-md"
                            : "bg-secondary/40 hover:bg-secondary border-border/70 text-muted-foreground hover:text-foreground hover:border-border"
                        )}
                      >
                        <span className="font-mono text-sm md:text-base font-bold leading-none">{val}</span>
                        <span className="text-[10px] uppercase font-mono tracking-tight text-right sm:text-center leading-tight">
                          {scaleLabels[val]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

