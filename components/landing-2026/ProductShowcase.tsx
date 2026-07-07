"use client";

import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { LANDING_PRODUCTS } from "@/lib/landingProducts";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

export default function ProductShowcase() {
  return (
    <section id="products" className="relative">
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

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-24 sm:grid-cols-2 lg:grid-cols-3"
      >
        {LANDING_PRODUCTS.map((product, i) => (
          <motion.div key={product.id} variants={slideUp}>
            <ProductCard product={product} index={i + 1} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
