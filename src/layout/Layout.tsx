import React from "react";
import { Header } from "./components/Header";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col efferd-grid relative w-full max-w-full">
      <div className="efferd-glow absolute inset-0 pointer-events-none" />
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10 min-w-0 max-w-full">
        {children}
      </main>
      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground relative z-10 w-full max-w-full">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} SurveyForm Platform. Built for Capstone, Research & Online Surveys.</p>
          <p className="font-mono text-[11px] text-muted-foreground/80">Tailored with Efferd & Supabase</p>
        </div>
      </footer>
    </div>
  );
}

