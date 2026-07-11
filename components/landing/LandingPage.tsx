"use client";

import { MotionConfig } from "motion/react";
import type { LandingStats } from "./ProofBar";

import Header from "./Header";
import Hero from "./Hero";
import ProductShowcase from "./ProductShowcase";
import HowItWorks from "./HowItWorks";
import VideoTestimonials from "./VideoTestimonials";
import FaqSection from "./FaqSection";
import FinalCTA from "./FinalCTA";
import Footer from "./Footer";
import FloatingWhatsApp from "./FloatingWhatsApp";

interface LandingPageProps {
  stats: LandingStats;
}

export default function LandingPage({ stats }: LandingPageProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className="lp-2026 min-h-screen w-full max-w-full overflow-x-clip bg-background">
        <Header />

        <main>
          <Hero stats={stats} />
          <ProductShowcase />
          <HowItWorks />
          <VideoTestimonials />
          <FaqSection />
          <FinalCTA />
        </main>

        <Footer />

        <FloatingWhatsApp />
      </div>
    </MotionConfig>
  );
}
