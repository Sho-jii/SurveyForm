import React from "react";
import { Header } from "@/layout/components/Header";
import { HeroSection } from "@/features/landing/components/HeroSection";
import { FeatureCardsSection } from "@/features/landing/components/FeatureCardsSection";
import { WorkflowSection } from "@/features/landing/components/WorkflowSection";
import { InteractiveLikertDemo } from "@/features/landing/components/InteractiveLikertDemo";
import { FaqsSection } from "@/features/landing/components/FaqsSection";
import { LandingFooter } from "@/features/landing/components/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-background text-foreground efferd-grid">
      <Header />
      <main className="grow">
        <HeroSection />
        <FeatureCardsSection />
        <WorkflowSection />
        <InteractiveLikertDemo />
        <FaqsSection />
      </main>
      <LandingFooter />
    </div>
  );
}
