"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconArrowRight, IconVerifiedCheck } from "@/components/icons";
import { slideUp, staggerContainer } from "@/lib/motion";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Teal glow backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,var(--color-brand-500)_0%,transparent_70%)] opacity-40 dark:opacity-15"
      />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="max-w-4xl mx-auto px-4 pt-20 pb-24 text-center space-y-6"
      >
        <motion.div variants={slideUp}>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium rounded-full border border-brand-700/40 bg-brand-400/40 dark:bg-brand-1100/40 px-3 py-1.5 text-brand-1000 dark:text-brand-600">
            <IconVerifiedCheck className="size-3.5" />
            Fronus Installer Program Management System
          </span>
        </motion.div>

        <motion.h1
          variants={slideUp}
          className="text-4xl sm:text-6xl font-bold tracking-tight text-balance"
        >
          Install. Track.{" "}
          <span className="text-brand-900 dark:text-brand-700">
            Get Rewarded.
          </span>
        </motion.h1>

        <motion.p
          variants={slideUp}
          className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance"
        >
          The complete platform for Fronus solar installers — register
          installations, earn rewards for every product you install, and get
          paid straight to your bank account.
        </motion.p>

        <motion.div
          variants={slideUp}
          className="flex flex-wrap items-center justify-center gap-3 pt-2"
        >
          <Button size="lg" asChild>
            <Link href="/auth/installer">
              Check My Rewards
              <IconArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/signin">Team Sign In</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
