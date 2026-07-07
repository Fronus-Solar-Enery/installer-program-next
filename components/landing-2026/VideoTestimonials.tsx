"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import TestimonialCard, { type Testimonial } from "./TestimonialCard";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

const ITEMS: Testimonial[] = [
  { id: "1", name: "Imran K.", city: "Lahore", earned: "Rs 45,000" },
  { id: "2", name: "Bilal A.", city: "Faisalabad", earned: "Rs 30,000" },
  { id: "3", name: "Usman R.", city: "Multan", earned: "Rs 60,000" },
  { id: "4", name: "Adnan M.", city: "Rawalpindi", earned: "Rs 25,000" },
  { id: "5", name: "Faisal H.", city: "Gujranwala", earned: "Rs 50,000" },
  { id: "6", name: "Zeeshan T.", city: "Sialkot", earned: "Rs 35,000" },
];

export default function VideoTestimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // IntersectionObserver: play only the single center-most card
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

    const observer = new IntersectionObserver(
      (entries) => {
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

  // Duplicate items for seamless marquee loop
  const looped = [...ITEMS, ...ITEMS];

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="py-24"
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

      <div className="relative mt-14">
        {/* Left fade mask */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-r from-background to-transparent"
        />
        {/* Right fade mask */}
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-24 bg-gradient-to-l from-background to-transparent"
        />

        <div className="overflow-hidden">
          <div className="lp-marquee flex w-max gap-6 py-4">
            {looped.map((item, i) => (
              <TestimonialCard
                key={`${item.id}-${i}`}
                item={item}
                active={activeId === item.id}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
