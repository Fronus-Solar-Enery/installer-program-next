"use client";

import { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { motion, useInView, useSpring, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  IconWhatsapp,
  IconArrowRight,
  IconCheck,
  IconStar,
} from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { REWARD_AMOUNT_PKR } from "@/lib/landingProducts";
import { slideUp, staggerContainer } from "@/lib/motion";
import ProofBar from "./ProofBar";
import type { LandingStats } from "./ProofBar";

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
      className="lp-glass absolute -bottom-6 left-4 w-60 rounded-3xl p-4 sm:-left-8 sm:bottom-10 squircle"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-900 dark:bg-brand-800">
          <IconCheck className="size-5 text-white dark:text-brand-1200" />
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

interface LandingPageProps {
  stats: LandingStats;
}
export default function Hero({ stats }: LandingPageProps) {
  return (
    <section className="min-h-screen flex flex-col justify-between">
      <div
        id="lp-hero"
        className="grow relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 pb-20 pt-32 sm:pt-36 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:pb-24"
      >
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:items-start gap-6 order-2 lg:order-1 items-center"
        >
          <motion.span
            variants={slideUp}
            className="lp-glass inline-flex items-center gap-2 rounded-full pl-3.5 pr-4.5 py-1.5 text-xs font-medium text-brand-1000 dark:text-brand-800 w-max"
          >
            <IconStar className="size-3.5! text-yellow-400" fill /> Fronus ×
            SolaX · Installer Program 2026
          </motion.span>

          <motion.h1
            variants={slideUp}
            className="text-center sm:text-left font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.25rem]"
          >
            <span className="block">Install Fronus.</span>
            <span className="block text-brand-900 dark:text-brand-800 font-mono">
              Earn Rs.
              <AnimatedCounter value={REWARD_AMOUNT_PKR} />
            </span>
            <span className="block text-muted-foreground">every time.</span>
          </motion.h1>

          <motion.p
            variants={slideUp}
            className="max-w-xl text-pretty text-lg text-muted-foreground text-center sm:text-left"
          >
            For solar installers and technicians across Pakistan. A flat reward
            on every eligible inverter you install - sent straight to your bank.
          </motion.p>

          <motion.div
            variants={slideUp}
            className="flex w-full gap-3 pt-2 flex-col sm:w-auto sm:flex-row sm:items-center"
          >
            <Button
              size="lg"
              asChild
              className="lp-glow-brand group rounded-full bg-brand-900 pl-4 pr-5 text-base text-white hover:bg-brand-1000 dark:bg-brand-800 dark:text-brand-1200 dark:hover:bg-brand-700"
            >
              <a
                href={buildWhatsAppUrl({
                  intent: "join",
                  source: "hero-primary",
                })}
                {...WHATSAPP_LINK_ATTRS}
              >
                Join on WhatsApp
                <IconWhatsapp fill className="ml-2 size-5" />
                {/* <span className="lp-btn-icon ml-3">
                <IconArrowRight className="size-3.5" />
              </span> */}
              </a>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="rounded-full text-base text-muted-foreground hover:text-foreground px-4"
            >
              <a href="/auth/installer">
                Installer Login
                <IconArrowRight className="ml-2 bg-foreground/10 rounded-full size-7 p-1.5" />
              </a>
            </Button>
          </motion.div>

          <motion.p
            variants={slideUp}
            className="text-sm text-muted-foreground text-center sm:text-left"
          >
            Registration takes minutes — our team verifies you on WhatsApp.
          </motion.p>
        </motion.div>

        {/* Plain (untransformed) positioning context so RewardReceipt's
          backdrop-filter isn't killed by the product's animated transform. */}
        <div className="relative mx-auto w-full max-w-md lg:max-w-none order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 110,
              damping: 20,
              delay: 0.25,
            }}
            className="relative overflow-hidden"
          >
            <Image
              src="/products/X1-Genki-8kw-01.webp"
              alt="Fronus X1-Genki hybrid inverter, co-branded with SolaX Power"
              width={720}
              height={790}
              priority
              loading="eager"
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="mx-auto h-auto w-full max-w-lg select-none pointer-events-none"
            />
          </motion.div>
          <RewardReceipt />
        </div>
      </div>
      <ProofBar stats={stats} />
    </section>
  );
}
