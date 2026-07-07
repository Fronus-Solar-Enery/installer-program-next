"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import TestimonialCard, { type Testimonial } from "./TestimonialCard";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";
import { EASE_ENTER } from "@/lib/gsapEases";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

/**
 * Placeholder testimonials — branded posters ship today; real installer clips
 * are a 1-line swap (set `videoSrc` on each item). Cities/earnings are
 * illustrative placeholders, not real data.
 */
const ITEMS: Testimonial[] = [
  { id: "1", name: "Imran K.", city: "Lahore", earned: "Rs 45,000" },
  { id: "2", name: "Bilal A.", city: "Faisalabad", earned: "Rs 30,000" },
  { id: "3", name: "Usman R.", city: "Multan", earned: "Rs 60,000" },
  { id: "4", name: "Adnan M.", city: "Rawalpindi", earned: "Rs 25,000" },
  { id: "5", name: "Faisal H.", city: "Gujranwala", earned: "Rs 50,000" },
  { id: "6", name: "Zeeshan T.", city: "Sialkot", earned: "Rs 35,000" },
];

/**
 * Video Testimonials — continuous slow marquee that pauses on hover, with a
 * single shared IntersectionObserver that plays ONLY the most-centered card.
 *
 * Bandwidth discipline (critical on Pakistani mobile networks):
 *  - preload="none" on every video
 *  - only the single center card plays at any time; all others pause + reset
 *  - reduced-motion: no autoplay, posters only
 */
export default function VideoTestimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // --- GSAP seamless marquee ---
  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        // No marquee — static row, scroll horizontally natively.
        return;
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const track = trackRef.current;
        if (!track) return;

        // Seamless loop: duplicate content via x-translation of -50%.
        const tween = gsap.to(track, {
          xPercent: -50,
          duration: 40,
          ease: "none",
          repeat: -1,
        });

        // Pause when section is off-screen (perf).
        const st = ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? tween.play() : tween.pause()),
        });

        // Pause on hover (desktop).
        const onEnter = () => tween.pause();
        const onLeave = () => tween.play();
        track.addEventListener("mouseenter", onEnter);
        track.addEventListener("mouseleave", onLeave);

        return () => {
          st.kill();
          track.removeEventListener("mouseenter", onEnter);
          track.removeEventListener("mouseleave", onLeave);
        };
      });
    },
    { scope: sectionRef },
  );

  // --- IntersectionObserver: play only the single center-most card ---
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const cards = Array.from(
      section.querySelectorAll<HTMLElement>(".testimonial-card"),
    );
    const videos = cards
      .map((c) => c.querySelector<HTMLVideoElement>("video"))
      .filter((v): v is HTMLVideoElement => Boolean(v));

    if (reduce || videos.length === 0) return;

    // Only the card whose center is nearest the viewport center plays.
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most-centered intersecting card.
        let best: { id: string; dist: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const viewportCenter = window.innerWidth / 2;
          const dist = Math.abs(cardCenter - viewportCenter);
          const id = el.dataset.testid?.replace("testimonial-", "") ?? "";
          if (!best || dist < best.dist) best = { id, dist };
        }
        if (!best) return;

        setActiveId(best.id);
        videos.forEach((v) => {
          const card = v.closest<HTMLElement>(".testimonial-card");
          const cardId = card?.dataset.testid?.replace("testimonial-", "");
          if (cardId === best!.id) {
            v.play().catch(() => {});
          } else {
            v.pause();
            v.currentTime = 0;
          }
        });
      },
      { rootMargin: "-40% 0px -40% 0px", threshold: 0 },
    );

    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, []);

  // Duplicate the list for the seamless marquee loop.
  const looped = [...ITEMS, ...ITEMS];

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="overflow-hidden py-24"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="mx-auto max-w-6xl space-y-3 px-4 text-center"
      >
        <motion.p
          variants={slideUp}
          className="text-xs uppercase tracking-[0.3em] text-brand-800"
        >
          From The Field
        </motion.p>
        <motion.h2
          variants={slideUp}
          className="font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl"
        >
          Installers already earning
        </motion.h2>
        <motion.p
          variants={slideUp}
          className="mx-auto max-w-xl text-muted-foreground text-balance"
        >
          Real Fronus installers across Pakistan. Real rewards in their bank.
        </motion.p>
      </motion.div>

      <div
        ref={trackRef}
        className="mt-14 flex w-max gap-6 px-8"
        style={{ willChange: "transform" }}
      >
        {looped.map((item, i) => (
          <TestimonialCard
            key={`${item.id}-${i}`}
            item={item}
            active={activeId === item.id}
          />
        ))}
      </div>
    </section>
  );
}
