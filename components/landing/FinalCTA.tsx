"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { IconWhatsapp, IconArrowRight } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

export default function FinalCTA() {
  return (
    <section className="lp-section relative overflow-hidden border-t border-border/60 bg-brand-200/60 px-4 dark:bg-brand-1200/40">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="mx-auto flex max-w-3xl flex-col items-center gap-7 text-center"
      >
        <motion.h2
          variants={slideUp}
          className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl"
        >
          Your next install is worth{" "}
          <span className="font-number text-brand-900 tabular-nums dark:text-brand-800">
            Rs 5,000
          </span>
        </motion.h2>

        <motion.p
          variants={slideUp}
          className="max-w-lg text-pretty text-muted-foreground"
        >
          Message us on WhatsApp, get registered in minutes, and start earning
          on the installs you&apos;re already doing.
        </motion.p>

        <motion.div variants={slideUp}>
          <Button
            size="lg"
            asChild
            className="lp-glow-brand group h-13 rounded-full bg-brand-900 pl-5 pr-5.5 text-base text-white hover:bg-brand-1000 sm:text-lg dark:bg-brand-800 dark:text-brand-1200 dark:hover:bg-brand-700"
          >
            <a
              href={buildWhatsAppUrl({ intent: "join", source: "final-cta" })}
              {...WHATSAPP_LINK_ATTRS}
            >
              <IconWhatsapp fill className="mr-2 size-5" />
              Join the Installer Program
              <span className="lp-btn-icon ml-3 bg-foreground/20">
                <IconArrowRight className="size-3.5" />
              </span>
            </a>
          </Button>
        </motion.div>

        <motion.p variants={slideUp} className="text-sm text-muted-foreground">
          Free to join · No forms · No exclusivity
        </motion.p>
      </motion.div>
    </section>
  );
}
