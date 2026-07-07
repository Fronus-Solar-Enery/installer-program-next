"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import type { LandingStats } from "@/components/landing/StatsSection";

import Preloader from "./Preloader";
import GrainOverlay from "./GrainOverlay";
import Header2026 from "./Header2026";
import Hero2026 from "./Hero2026";
import ProofBar from "./ProofBar";
import ProductShowcase from "./ProductShowcase";
import HowItWorks2026 from "./HowItWorks2026";
import VideoTestimonials from "./VideoTestimonials";
import FinalCTA from "./FinalCTA";
import Footer2026 from "./Footer2026";
import FloatingWhatsApp from "./FloatingWhatsApp";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

interface LandingPage2026Props {
  stats: LandingStats;
}

/**
 * Landing Page 2026 — client composition.
 *
 * Owns three cross-cutting concerns so individual sections stay focused:
 *  1. Forced dark theme for this route (the premium aesthetic is dark-only).
 *  2. Lenis smooth scroll, synced with GSAP ScrollTrigger.
 *  3. Preloader gating — the preloader locks scroll; once it unmounts we start
 *     Lenis and refresh ScrollTrigger so the pin measurements are correct.
 */
export default function LandingPage2026({ stats }: LandingPage2026Props) {
  const [preloaded, setPreloaded] = useState(false);
  const lenisRef = useRef<Lenis | null>(null);
  const { contextSafe } = useGSAP();

  // --- Forced dark for this route only ---
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.getAttribute("data-theme");
    root.classList.add("dark");
    return () => {
      root.classList.remove("dark");
      if (prev) root.setAttribute("data-theme", prev);
    };
  }, []);

  // --- Lenis smooth scroll, started AFTER the preloader releases ---
  const startLenis = contextSafe(() => {
    if (lenisRef.current) return; // already started

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // Recalculate all the pin/scrub triggers now that layout is settled.
    ScrollTrigger.refresh();

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  });

  useEffect(() => {
    if (!preloaded) return;
    const cleanup = startLenis();
    return cleanup;
  }, [preloaded, startLenis]);

  return (
    <div className="lp-2026 min-h-screen bg-background">
      {!preloaded && <Preloader onComplete={() => setPreloaded(true)} />}

      <GrainOverlay />

      <Header2026 />

      <main>
        <Hero2026 />
        <ProofBar stats={stats} />
        <ProductShowcase />
        <HowItWorks2026 />
        <VideoTestimonials />
        <FinalCTA />
      </main>

      <Footer2026 />

      <FloatingWhatsApp />
    </div>
  );
}
