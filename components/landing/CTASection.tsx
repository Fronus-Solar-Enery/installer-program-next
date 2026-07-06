"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconWhatsapp } from "@/components/icons";
import { staggerContainer, slideUp, VIEWPORT_ONCE } from "@/lib/motion";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden border-t border-border/50">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_100%,var(--color-brand-500)_0%,transparent_70%)] opacity-40 dark:opacity-15"
      />
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="max-w-3xl mx-auto px-4 py-24 text-center space-y-6"
      >
        <motion.h2
          variants={slideUp}
          className="text-3xl sm:text-5xl font-bold tracking-tight text-balance"
        >
          Ready to start earning with Fronus?
        </motion.h2>
        <motion.p variants={slideUp} className="text-muted-foreground text-balance">
          Contact the Fronus team to join the installer program — registration
          takes minutes and your first reward is one installation away.
        </motion.p>
        <motion.div
          variants={slideUp}
          className="flex flex-wrap items-center justify-center gap-3"
        >
          <Button size="lg" asChild>
            <a
              href="https://wa.me/923000000000"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconWhatsapp className="mr-2 size-4.5" />
              Contact on WhatsApp
            </a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/auth/installer">Installer Login</Link>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
