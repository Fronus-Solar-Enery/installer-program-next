"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { IconWhatsapp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

export default function FinalCTA() {
  return (
    <section className="relative flex min-h-[80vh] items-center justify-center overflow-hidden border-t border-border/40 px-4 py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="flex flex-col items-center gap-8 text-center"
      >
        <motion.h2
          variants={slideUp}
          className="font-display max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl"
        >
          Your next install is worth{" "}
          <span className="text-brand-800 font-number">5,000 PKR</span>
        </motion.h2>

        <motion.p
          variants={slideUp}
          className="max-w-lg text-muted-foreground text-balance"
        >
          Join the Fronus Installer Program. Get your code on WhatsApp in
          minutes. Start earning today.
        </motion.p>

        <motion.div variants={slideUp}>
          <Button
            size="lg"
            asChild
            className="text-base sm:text-lg rounded-full"
          >
            <a
              href={buildWhatsAppUrl({ intent: "join", source: "final-cta" })}
              {...WHATSAPP_LINK_ATTRS}
            >
              <IconWhatsapp fill className="mr-2 size-5" />
              Join the Installer Program
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
