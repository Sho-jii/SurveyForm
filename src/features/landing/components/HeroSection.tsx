"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SurveyUploadDropzone } from "@/features/surveys/components/SurveyUploadDropzone";
import { DecorIcon } from "@/components/ui/decor-icon";
import {
  Rocket,
  ArrowRight,
  FileSpreadsheet,
  Layers,
  Sparkles,
  BarChart3,
  ShieldCheck,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function HeroSection() {
  const router = useRouter();

  const handleParsed = (parsedData: any) => {
    try {
      sessionStorage.setItem("survey_draft", JSON.stringify(parsedData));
      router.push("/surveys/new");
    } catch (e) {
      console.error(e);
      router.push("/surveys/new");
    }
  };

  return (
    <section className="relative mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 overflow-clip">
      {/* Top Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -top-20 isolate -z-10 bg-[radial-gradient(40%_70%_at_50%_0%,oklch(0.985_0_0_/_0.09),transparent)]"
      />

      {/* Vertical Faded Guideline Borders */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-4 w-px bg-border/40 hidden md:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-4 w-px bg-border/40 hidden md:block"
      />

      <div className="relative isolate flex flex-col items-center justify-center gap-6 text-center">
        {/* Announcement Pill Badge */}
        <a
          href="#dropzone"
          className={cn(
            "group flex w-fit items-center gap-2.5 rounded-none border border-border/80 bg-card/80 px-3.5 py-1 text-xs font-mono uppercase tracking-widest text-muted-foreground shadow-sm transition-all hover:border-foreground/40 hover:text-foreground",
            "fade-in slide-in-from-bottom-6 animate-in duration-500 ease-out"
          )}
        >
          <Rocket className="size-3 text-primary animate-pulse" />
          <span>Universal PDF Survey Engine</span>
          <span className="block h-3 w-px bg-border" />
          <span className="text-foreground font-semibold flex items-center gap-1">
            v1.0 Ready
            <ArrowRight className="size-3 transition-transform duration-150 ease-out group-hover:translate-x-1" />
          </span>
        </a>

        {/* Hero Title */}
        <h1
          className={cn(
            "font-heading font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight text-balance text-foreground max-w-4xl",
            "fade-in slide-in-from-bottom-8 animate-in delay-100 duration-500 ease-out"
          )}
        >
          Transform Any Survey PDF into an Online Form in Seconds
        </h1>

        {/* Hero Subtitle */}
        <p
          className={cn(
            "max-w-2xl text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed text-balance",
            "fade-in slide-in-from-bottom-10 animate-in delay-200 duration-500 ease-out"
          )}
        >
          Effortlessly digitize ISO/IEC 25010 & UTAUT evaluation questionnaires or custom Likert matrices.
          Toggle field requirements, distribute instant public links, and monitor response analytics with full response-editing and audit exports.
        </p>

        {/* Call to Action Buttons */}
        <div
          className={cn(
            "flex flex-wrap items-center justify-center gap-3 pt-2",
            "fade-in slide-in-from-bottom-12 animate-in delay-300 duration-500 ease-out"
          )}
        >
          <a href="#dropzone">
            <Button size="lg" className="rounded-none font-mono text-xs uppercase tracking-wider gap-2">
              <Sparkles className="size-4" />
              <span>Drop Questionnaire PDF</span>
            </Button>
          </a>
          <Link href="/surveys">
            <Button size="lg" variant="outline" className="rounded-none font-mono text-xs uppercase tracking-wider gap-2">
              <Layers className="size-4 text-primary" />
              <span>Explore Surveys</span>
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        </div>

        {/* System Highlights Ribbon */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-muted-foreground/80">
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-400" />
            Zero-Radius Brutalist Box Design
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-400" />
            Postgres JSONB Storage
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-400" />
            Editable Submitted Responses
          </span>
          <span className="flex items-center gap-1.5">
            <Check className="size-3.5 text-emerald-400" />
            CSV, JSON & PDF Reports
          </span>
        </div>

        {/* Embedded Interactive PDF Dropzone Container */}
        <div id="dropzone" className="w-full max-w-3xl pt-10 text-left">
          <div className="relative border border-border/80 bg-card/60 p-2 md:p-4 rounded-none shadow-xl">
            <DecorIcon position="top-left" className="opacity-70" />
            <DecorIcon position="top-right" className="opacity-70" />
            <DecorIcon position="bottom-left" className="opacity-70" />
            <DecorIcon position="bottom-right" className="opacity-70" />

            <div className="flex items-center justify-between pb-3 px-2 border-b border-border/40 mb-3">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-none bg-emerald-400 inline-block animate-pulse" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">
                  Quick Survey Uploader
                </span>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Drop .pdf or browse
              </span>
            </div>

            <SurveyUploadDropzone onParsed={handleParsed} />
          </div>
        </div>
      </div>
    </section>
  );
}

