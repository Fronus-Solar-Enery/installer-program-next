"use client";

import { MotionConfig } from "motion/react";
import type { LandingStats } from "./ProofBar";

import Header2026 from "./Header2026";
import Hero2026 from "./Hero2026";
import ProofBar from "./ProofBar";
import ProductShowcase from "./ProductShowcase";
import HowItWorks2026 from "./HowItWorks2026";
import VideoTestimonials from "./VideoTestimonials";
import FaqSection from "./FaqSection";
import FinalCTA from "./FinalCTA";
import Footer2026 from "./Footer2026";
import FloatingWhatsApp from "./FloatingWhatsApp";

interface LandingPage2026Props {
  stats: LandingStats;
}

export default function LandingPage2026({ stats }: LandingPage2026Props) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="lp-2026 min-h-screen w-full max-w-full overflow-x-clip bg-background">
        <Header2026 />

        <main>
          <Hero2026 />
          <ProofBar stats={stats} />
          <ProductShowcase />
          <HowItWorks2026 />
          <VideoTestimonials />
          <FaqSection />
          <FinalCTA />
        </main>

        <Footer2026 />

        <FloatingWhatsApp />
      </div>
    </MotionConfig>
  );
}
