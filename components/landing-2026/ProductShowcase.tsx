"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { LANDING_PRODUCTS } from "@/lib/landingProducts";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function ProductShowcase() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        return;
      });

      mm.add(
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
        () => {
          const track = trackRef.current;
          const section = sectionRef.current;
          if (!track || !section) return;

          const getScrollAmount = () =>
            -(track.scrollWidth - window.innerWidth + 64);

          const tween = gsap.to(track, {
            x: getScrollAmount,
            ease: "none",
          });

          const st = ScrollTrigger.create({
            trigger: section,
            start: "top 75%",
            end: () => `+=${Math.abs(getScrollAmount())}`,
            pin: true,
            animation: tween,
            scrub: 1.2,
            invalidateOnRefresh: true,
          });

          return () => st.kill();
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="products"
      className="relative overflow-hidden"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="mx-auto max-w-6xl space-y-3 px-4 pt-24 pb-12 text-center"
      >
        <motion.p
          variants={slideUp}
          className="text-xs uppercase tracking-[0.3em] text-brand-800"
        >
          Eligible Products
        </motion.p>
        <motion.h2
          variants={slideUp}
          className="font-display text-3xl font-bold tracking-tight text-balance sm:text-5xl"
        >
          Every Fronus inverter pays{" "}
          <span className="text-brand-800">Rs 5,000</span>
        </motion.h2>
        <motion.p
          variants={slideUp}
          className="mx-auto max-w-xl text-muted-foreground text-balance"
        >
          Install any of these. Register the serial. The reward lands in your
          bank — flat, no tiers, no fine print.
        </motion.p>
      </motion.div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto px-8 pb-24 lg:overflow-visible lg:justify-center scrollbar-hide"
      >
        {LANDING_PRODUCTS.map((product, i) => (
          <div key={product.id} className="snap-center shrink-0 lg:snap-none">
            <ProductCard product={product} index={i + 1} />
          </div>
        ))}
      </div>
    </section>
  );
}
