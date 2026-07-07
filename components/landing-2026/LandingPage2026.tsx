"use client";

import { useEffect, useState } from "react";
import type { LandingStats } from "@/components/landing/StatsSection";

import Preloader from "./Preloader";
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
  const [preloaded, setPreloaded] = useState(false);

  // Forced dark theme for this route only
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.classList.add("dark");
    return () => {
      root.classList.remove("dark");
      if (prev) root.setAttribute("data-theme", prev);
    };
  }, []);

  return (
    <div className="lp-2026 min-h-screen bg-background">
      {!preloaded && <Preloader onComplete={() => setPreloaded(true)} />}

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
  );
}
