import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ArrowUpRight } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="mx-auto w-full max-w-6xl border-t border-border/50 px-4 sm:px-6 lg:px-8 py-10 mt-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-border/30">
        <BrandLogo size="md" />

        <nav>
          <ul className="flex flex-wrap gap-6 text-xs font-mono uppercase tracking-wider text-muted-foreground">
            <li>
              <Link href="/surveys" className="hover:text-foreground transition-colors">
                Surveys
              </Link>
            </li>
            <li>
              <Link href="/surveys/new" className="hover:text-foreground transition-colors">
                New Survey
              </Link>
            </li>
            <li>
              <a href="#dropzone" className="hover:text-foreground transition-colors">
                Upload PDF
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[11px] font-mono text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} SurveyForm Platform. Brutalist Box Architecture.</p>
        <div className="flex items-center gap-4">
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="size-1.5 bg-emerald-400 inline-block animate-pulse" />
            Supabase Connected
          </span>
          <span>PORT: 3020</span>
        </div>
      </div>
    </footer>
  );
}

