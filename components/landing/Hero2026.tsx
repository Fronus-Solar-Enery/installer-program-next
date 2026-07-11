"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useInView, useSpring, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import { IconWhatsapp, IconArrowRight, IconCheck } from "@/components/icons";
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

/**
 * The signature trust artifact: a bank-credit receipt. The page's whole job
 * is defeating "will I actually get paid?" — so the hero shows the moment
 * of getting paid.
 */
function RewardReceipt() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 130, damping: 19, delay: 0.55 }}
      className="lp-glass absolute -bottom-6 left-4 w-60 rounded-2xl p-4 sm:-left-8 sm:bottom-10"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-900 dark:bg-brand-700">
          <IconCheck className="size-4 text-white dark:text-brand-1200" />
        </span>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Reward credited</p>
          <p className="font-number text-xl leading-tight tabular-nums text-foreground">
            Rs 5,000
          </p>
        </div>
      </div>
      <div className="my-3 border-t border-dashed border-foreground/15" />
      <p className="text-xs text-muted-foreground">
        Bank transfer · Verified install
      </p>
    </motion.div>
  );
}

export default function Hero2026() {
  return (
    <section
      id="lp-hero"
      className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-32 sm:pt-36 lg:min-h-[92vh] lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:pb-24"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="flex flex-col items-start gap-6"
      >
        <motion.span
          variants={slideUp}
          className="lp-glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-brand-1000 dark:text-brand-600"
        >
          Fronus × SolaX · Installer Program 2026
        </motion.span>

        <motion.h1
          variants={slideUp}
          className="font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.25rem]"
        >
          <span className="block">Install Fronus.</span>
          <span className="block text-brand-900 dark:text-brand-600">
            Earn Rs <AnimatedCounter value={REWARD_AMOUNT_PKR} />
          </span>
          <span className="block text-muted-foreground">every time.</span>
        </motion.h1>

        <motion.p
          variants={slideUp}
          className="max-w-xl text-pretty text-lg text-muted-foreground"
        >
          For solar installers and technicians across Pakistan. A flat reward
          on every eligible inverter you fit — sent straight to your bank.
        </motion.p>

        <motion.div
          variants={slideUp}
          className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row sm:items-center"
        >
          <Button
            size="lg"
            asChild
            className="lp-glow-brand group rounded-full bg-brand-900 pr-3 text-base text-white hover:bg-brand-1000 dark:bg-brand-700 dark:text-brand-1200 dark:hover:bg-brand-600"
          >
            <a
              href={buildWhatsAppUrl({
                intent: "join",
                source: "hero-primary",
              })}
              {...WHATSAPP_LINK_ATTRS}
            >
              <IconWhatsapp fill className="mr-2 size-5" />
              Join on WhatsApp
              <span className="lp-btn-icon ml-3">
                <IconArrowRight className="size-3.5" />
              </span>
            </a>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            asChild
            className="rounded-full text-base text-muted-foreground hover:text-foreground"
          >
            <a href="/auth/installer">
              Login to Installer Portal
              <IconArrowRight className="ml-2 size-3.5" />
            </a>
          </Button>
        </motion.div>

        <motion.p
          variants={slideUp}
          className="text-sm text-muted-foreground"
        >
          Registration takes minutes — our team verifies you on WhatsApp.
        </motion.p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 110, damping: 20, delay: 0.25 }}
        className="relative mx-auto w-full max-w-md lg:max-w-none"
      >
        <div className="lp-product-glow relative overflow-hidden rounded-4xl bg-linear-to-b from-brand-300 to-brand-200 dark:from-brand-1100 dark:to-brand-1200">
          <Image
            src="/products/X1-Genki-6kw-01.webp"
            alt="Fronus X1-Genki hybrid inverter, co-branded with SolaX Power"
            width={720}
            height={790}
            priority
            sizes="(max-width: 1024px) 90vw, 40vw"
            className="mx-auto h-auto w-full max-w-sm p-8 sm:p-10"
          />
        </div>
        <RewardReceipt />
      </motion.div>
    </section>
  );
}
