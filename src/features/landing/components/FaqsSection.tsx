"use client";

import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DecorIcon } from "@/components/ui/decor-icon";

const faqs = [
  {
    id: "item-1",
    title: "What types of survey questionnaires are supported?",
    content:
      "SurveyForm supports complex multi-dimensional questionnaires (such as ISO/IEC 25010 and UTAUT evaluation forms), 5-point Likert scale matrices, multiple-choice stakeholder groupings, open-ended comments, remarks, and signature inputs. The universal PDF parser extracts tables and questions automatically.",
  },
  {
    id: "item-2",
    title: "Can I make respondent fields (like Name) optional?",
    content:
      "Yes! You can toggle 'Make All Required' or 'Make All Optional' with a single click, or toggle individual fields. For example, you can make the respondent Name optional for anonymous feedback while keeping stakeholder role and Likert ratings required.",
  },
  {
    id: "item-3",
    title: "How is the survey and response data stored?",
    content:
      "All surveys and responses are stored in Supabase PostgreSQL using universal JSONB columns (`schema` and `answers`). This enables SurveyForm to dynamically adapt to any questionnaire structure without requiring database migrations for new question types.",
  },
  {
    id: "item-4",
    title: "Can I edit or correct responses after they are submitted?",
    content:
      "Yes. In the survey management dashboard under the 'Responses' tab, you can view every submission in a searchable table, open the Response Editor modal, and modify or correct recorded values post-submission.",
  },
  {
    id: "item-5",
    title: "What export formats are available for research & reports?",
    content:
      "You can export all survey data in 3 formats: CSV (with UTF-8 BOM for Microsoft Excel compatibility), raw JSON for data science pipelines, and a styled publication-ready PDF evaluation report generated via jsPDF.",
  },
  {
    id: "item-6",
    title: "Does the public survey link require respondents to sign in?",
    content:
      "No. Public survey links (/s/[slug]) are accessible to anyone with the link. Respondents can fill and submit the form directly from any desktop or mobile browser without creating an account or logging in.",
  },
];

export function FaqsSection() {
  return (
    <section className="mx-auto grid w-full max-w-6xl grid-cols-1 md:grid-cols-2 lg:border-x border-border/40 py-20 px-4 sm:px-6 lg:px-8">
      <div className="pt-4 pb-8 pr-0 md:pr-12">
        <div className="space-y-4">
          <span className="text-[11px] font-mono uppercase tracking-widest text-primary font-semibold">
            Knowledge Base
          </span>
          <h2 className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl tracking-tight text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Everything you need to know about PDF questionnaire parsing, Likert scale analytics, field tailoring, and response management.
          </p>
          <div className="pt-2">
            <span className="text-xs font-mono text-muted-foreground">
              Questions or custom integration?{" "}
              <a href="/surveys" className="text-primary hover:underline">
                View your dashboard →
              </a>
            </span>
          </div>
        </div>
      </div>

      <div className="relative place-content-center">
        {/* Vertical Guide Line */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-3 h-full w-px bg-border/40 hidden md:block"
        />

        <Accordion
          className="rounded-none border-x-0 border-y border-border/60"
          collapsible
          type="single"
        >
          {faqs.map((item) => (
            <AccordionItem
              className="group relative pl-4 md:pl-8 rounded-none border-border/50"
              key={item.id}
              value={item.id}
            >
              <DecorIcon
                className="left-[13px] size-3 group-last:hidden opacity-50"
                position="bottom-left"
              />

              <AccordionTrigger className="px-3 py-4 text-xs md:text-sm font-semibold hover:no-underline focus-visible:underline">
                {item.title}
              </AccordionTrigger>

              <AccordionContent className="px-3 pb-4 text-muted-foreground text-xs leading-relaxed">
                {item.content}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

