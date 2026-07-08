"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { IconWhatsapp, IconArrowRight } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { REWARD_AMOUNT_PKR } from "@/lib/landingProducts";
import { slideUp, staggerContainer } from "@/lib/motion";

function AnimatedCounter({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const [text, setText] = useState("0");

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, spring, value]);
  useEffect(() => display.on("change", setText), [display]);

  return (
    <span ref={ref} className="font-number tabular-nums">
      {text}
    </span>
  );
}

export default function Hero2026() {
  return (
    <section
      id="lp-hero"
      className="relative mx-auto flex min-h-[92vh] max-w-6xl flex-col items-center justify-center px-4 pt-28 pb-24 text-center"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col items-center space-y-7"
      >
        <motion.span
          variants={slideUp}
          className="lp-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-brand-700"
        >
          Fronus-SolaX Installer Program 2026
        </motion.span>

        <motion.h1
          variants={slideUp}
          className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl max-w-3xl"
        >
          <span className="block">Install Fronus.</span>
          <span className="block">
            Earn{" "}
            <span className="text-brand-800">
              Rs <AnimatedCounter value={REWARD_AMOUNT_PKR} />
            </span>
          </span>
          <span className="block text-muted-foreground">every time.</span>
        </motion.h1>

        <motion.p
          variants={slideUp}
          className="max-w-xl text-lg text-muted-foreground text-balance"
        >
          Join Pakistan&apos;s installer network. Get rewarded flat for every
          eligible inverter you install — paid straight to your bank.
        </motion.p>

        <motion.div
          variants={slideUp}
          className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center"
        >
          <Button size="lg" asChild className="text-base rounded-full">
            <a
              href={buildWhatsAppUrl({
                intent: "join",
                source: "hero-primary",
              })}
              {...WHATSAPP_LINK_ATTRS}
            >
              <IconWhatsapp fill className="mr-2 size-5" /> Join Now & Start
              Earning
            </a>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            asChild
            className="text-base rounded-full"
          >
            <a href="/auth/installer">
              Already installing? Check Stats
              <span className="ml-2">
                <IconArrowRight className="size-3.5" />
              </span>
            </a>
          </Button>
        </motion.div>
      </motion.div>
    </section>
  );
}
