"use client";

import { motion } from "motion/react";
import ProductCard from "./ProductCard";
import { LANDING_PRODUCTS } from "@/lib/landingProducts";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

export default function ProductShowcase() {
  return (
    <section id="products" className="lp-section relative scroll-mt-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="mx-auto max-w-6xl space-y-4 px-4 pb-14"
      >
        <motion.p
          variants={slideUp}
          className="text-xs font-medium uppercase tracking-[0.25em] text-brand-1000 dark:text-brand-600"
        >
          Eligible products
        </motion.p>
        <motion.h2
          variants={slideUp}
          className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl"
        >
          Three inverters. Same flat{" "}
          <span className="font-number text-brand-900 dark:text-brand-600">
            Rs 5,000
          </span>
          .
        </motion.h2>
        <motion.p
          variants={slideUp}
          className="max-w-2xl text-pretty text-muted-foreground"
        >
          No exclusivity and no tiers — keep installing whatever you already
          install, and earn on every eligible Fronus unit you fit. Units
          purchased after 1 July 2026 qualify.
        </motion.p>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {LANDING_PRODUCTS.map((product) => (
          <motion.div key={product.id} variants={slideUp}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
