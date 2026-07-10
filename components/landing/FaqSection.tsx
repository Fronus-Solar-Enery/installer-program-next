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
    q: "How do I join the Fronus Installer Program?",
    a: "Message us on WhatsApp. We'll register you and send your installer code + PIN — all through WhatsApp. The whole process takes just a few minutes.",
  },
  {
    q: "Which products are eligible for rewards?",
    a: "The X1-Genki series (6kW, 8/10/12kW single-phase) and the X3-Genki series (10/15kW three-phase) inverters are all eligible. Any Fronus inverter you install qualifies.",
  },
  {
    q: "How much do I earn per installation?",
    a: "Flat Rs 5,000 PKR per eligible install. No tiers, no caps, no fine print. Every install earns the same reward.",
  },
  {
    q: "How do I submit a reward claim?",
    a: "After installing a Fronus inverter, submit the serial number through WhatsApp. Our team verifies the install and processes your reward.",
  },
  {
    q: "How quickly do I get paid?",
    a: "Rewards are transferred directly to your bank account once the install is verified. Most payments are processed within a few business days.",
  },
  {
    q: "Can I install multiple systems?",
    a: "Absolutely. There's no limit on how many systems you can install. The more you install, the more you earn — it's that simple.",
  },
  {
    q: "Who do I contact for support?",
    a: "Reach us on WhatsApp anytime. Whether you have questions about the program, need help with a claim, or want to get started — we're just a message away.",
  },
];

export default function FaqSection() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-24">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="space-y-3 text-center mb-12"
      >
        <motion.p
          variants={slideUp}
          className="text-xs uppercase tracking-[0.3em] text-brand-800"
        >
          FAQ
        </motion.p>
        <motion.h2
          variants={slideUp}
          className="font-display text-3xl font-bold tracking-tight sm:text-5xl"
        >
          Frequently asked questions
        </motion.h2>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
      >
        <Accordion type="single" collapsible className="space-y-2">
          {FAQ_ITEMS.map((item, i) => (
            <motion.div key={i} variants={slideUp}>
              <AccordionItem
                value={`faq-${i}`}
                className="lp-glass rounded-2xl border-none px-6"
              >
                <AccordionTrigger className="py-5 text-base font-semibold text-foreground hover:no-underline hover:text-brand-800">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            </motion.div>
          ))}
        </Accordion>
      </motion.div>
    </section>
  );
}
