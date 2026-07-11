"use client";

import { motion } from "motion/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

const FAQ_ITEMS = [
  {
    q: "Is this real — will I actually get paid?",
    a: "Yes. The program is run by Fronus Solar Energy in official partnership with SolaX Power, and every reward is a flat Rs 5,000 bank transfer. Our team verifies each install before paying, and you can track every claim and payout in your installer portal.",
  },
  {
    q: "How fast do I get the money?",
    a: "Once your video is verified and the unit passes the eligibility check, the Rs 5,000 transfer to your bank is typically completed within a few working days — not weeks or months. You'll see the status change in your portal at every step.",
  },
  {
    q: "Which units are eligible?",
    a: "The X1-Genki (6 kW), X1-Genki (8/10/12 kW) single-phase and X3-Genki (10/15 kW) three-phase inverters. The unit must have been purchased after 1 July 2026 to qualify.",
  },
  {
    q: "What counts as a valid video?",
    a: "One single clip that shows the product installed and the serial number on the side sticker — both in the same video. Film it on your phone right after the install; no editing needed.",
  },
  {
    q: "How does registration work?",
    a: "Message us on WhatsApp. Our team verifies your details, registers you, and sends your installer code and PIN — usually within minutes. There are no forms and nothing to pay.",
  },
];

export default function FaqSection() {
  return (
    <section
      id="faq"
      className="lp-section scroll-mt-24 border-t border-border/60"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="space-y-4 self-start lg:sticky lg:top-32"
        >
          <motion.p
            variants={slideUp}
            className="text-xs font-medium uppercase tracking-[0.25em] text-brand-900 dark:text-brand-800"
          >
            FAQ
          </motion.p>
          <motion.h2
            variants={slideUp}
            className="font-display text-3xl font-bold tracking-tight sm:text-5xl"
          >
            Straight answers
          </motion.h2>
          <motion.p
            variants={slideUp}
            className="max-w-md text-pretty text-muted-foreground"
          >
            Anything else — ask us directly on WhatsApp and a team member will
            reply.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
        >
          <Accordion type="single" collapsible className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div key={item.q} variants={slideUp}>
                <AccordionItem
                  value={`faq-${i}`}
                  className="squircle rounded-2xl border border-foreground/10 bg-card px-6 dark:border-white/8"
                >
                  <AccordionTrigger className="py-5 text-left text-base font-semibold text-foreground hover:no-underline">
                    {item.q}
                  </AccordionTrigger>
                  <AccordionContent className="leading-relaxed text-muted-foreground">
                    {item.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
