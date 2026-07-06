"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  IconArrowRight,
  IconCheckCircle,
} from "@/components/icons";
import { staggerContainer, slideUp, VIEWPORT_ONCE } from "@/lib/motion";

const PERKS = [
  "See your total, paid, and pending rewards in one place",
  "Full installation history with payment status",
  "Track referral earnings from installers you brought in",
  "Share your verified profile page with customers",
];

export default function ForInstallersSection() {
  return (
    <section id="for-installers" className="max-w-6xl mx-auto px-4 py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="squircle rounded-4xl border border-brand-700/30 bg-gradient-to-br from-brand-300 to-brand-400 dark:from-brand-1200 dark:to-brand-1100 p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center"
      >
        <div className="space-y-5">
          <motion.h2
            variants={slideUp}
            className="text-3xl sm:text-4xl font-bold tracking-tight text-balance"
          >
            Already a Fronus installer?
          </motion.h2>
          <motion.p variants={slideUp} className="text-muted-foreground">
            Check your stats, track payments, and share your profile — sign in
            with your installer code and the PIN we sent to your WhatsApp.
          </motion.p>
          <motion.div variants={slideUp}>
            <Button size="lg" asChild>
              <Link href="/auth/installer">
                Open My Dashboard
                <IconArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </motion.div>
        </div>

        <motion.ul variants={slideUp} className="space-y-3">
          {PERKS.map((perk) => (
            <li key={perk} className="flex items-start gap-3">
              <IconCheckCircle className="size-5 shrink-0 mt-0.5 text-brand-1000 dark:text-brand-600" />
              <span className="text-sm sm:text-base">{perk}</span>
            </li>
          ))}
        </motion.ul>
      </motion.div>
    </section>
  );
}
