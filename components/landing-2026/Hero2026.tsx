"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import {
  IconWhatsapp,
  IconArrowRight,
  IconVerifiedCheck,
} from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { REWARD_AMOUNT_PKR } from "@/lib/landingProducts";
import { EASE_ENTER, EASE_MOVE } from "@/lib/gsapEases";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

function splitChars(text: string) {
  return text.split("").map((ch, i) => (
    <span
      key={i}
      className="char inline-block"
      style={{ willChange: "transform, opacity" }}
    >
      {ch === " " ? "\u00A0" : ch}
    </span>
  ));
}

export default function Hero2026() {
  const root = useRef<HTMLElement>(null);
  const productRef = useRef<HTMLImageElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(root.current?.querySelectorAll(".char") ?? [], {
          opacity: 1,
          y: 0,
        });
        if (counterRef.current)
          counterRef.current.textContent = REWARD_AMOUNT_PKR.toLocaleString();
        return;
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: EASE_ENTER } });
        const chars =
          root.current?.querySelectorAll<HTMLElement>(".char") ?? [];

        tl.from(".lp-hero-eyebrow", { autoAlpha: 0, y: 16, duration: 0.5 })
          .from(
            chars,
            { autoAlpha: 0, y: 28, duration: 0.7, stagger: 0.018 },
            "-=0.2",
          )
          .from(".lp-hero-sub", { autoAlpha: 0, y: 16, duration: 0.6 }, "-=0.4")
          .from(
            ".lp-hero-cta > *",
            { autoAlpha: 0, y: 14, duration: 0.5, stagger: 0.08 },
            "-=0.3",
          )
          .from(
            productRef.current,
            { autoAlpha: 0, scale: 0.9, duration: 1, ease: EASE_MOVE },
            "-=0.8",
          );

        const counter = { v: 0 };
        if (counterRef.current) {
          tl.to(
            counter,
            {
              v: REWARD_AMOUNT_PKR,
              duration: 1.2,
              ease: EASE_MOVE,
              onUpdate: () => {
                if (counterRef.current)
                  counterRef.current.textContent = Math.round(
                    counter.v,
                  ).toLocaleString();
              },
            },
            "-=0.6",
          );
        }

        gsap.to(productRef.current, {
          y: "+=12",
          duration: 3,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
        });

        ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
          animation: gsap.timeline().to(".lp-hero-content", {
            y: -80,
            opacity: 0,
            ease: "none",
          }),
        });
      });
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="lp-hero"
      className="relative mx-auto grid min-h-[92vh] max-w-6xl grid-cols-1 items-center gap-10 px-4 pt-28 pb-24 lg:grid-cols-[1.1fr_0.9fr]"
    >
      <div className="lp-hero-content space-y-7">
        <span className="lp-hero-eyebrow lp-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-brand-700">
          Fronus-SolaX Installer Program 2026
        </span>

        <h1 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl lg:text-7xl max-w-3xl">
          <span className="block">{splitChars("Install Fronus.")}</span>
          <span className="block">
            {splitChars("Earn ")}
            <span className="text-brand-800">
              Rs{" "}
              <span ref={counterRef} className="font-number tabular-nums">
                0
              </span>
            </span>
          </span>
          <span className="block text-muted-foreground">
            {splitChars("every time.")}
          </span>
        </h1>

        <p className="lp-hero-sub max-w-xl text-lg text-muted-foreground text-balance">
          Join Pakistan&apos;s installer network. Get rewarded flat for every
          eligible inverter you install — paid straight to your bank.
        </p>

        <div className="lp-hero-cta flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <Button size="lg" asChild className="text-base rounded-full">
            <a
              href={buildWhatsAppUrl({
                intent: "join",
                source: "hero-primary",
              })}
              {...WHATSAPP_LINK_ATTRS}
            >
              <IconWhatsapp fill className="mr-2 size-5" />
              Join Now & Start Earning
            </a>
          </Button>
          <Button
            size="lg"
            variant="ghost"
            asChild
            className="text-base rounded-full"
          >
            <a
              href={buildWhatsAppUrl({
                intent: "get-code",
                source: "hero-secondary",
              })}
              {...WHATSAPP_LINK_ATTRS}
            >
              Already installing? Check Stats
              <span className="lp-btn-icon ml-2">
                <IconArrowRight className="size-3.5" />
              </span>
            </a>
          </Button>
        </div>
      </div>

      <div
        ref={productRef}
        className="relative z-10 flex w-full max-w-md select-none items-center justify-center"
      >
        <Image
          src="/products/X3-Genki-10kw+15kW-02.webp"
          alt="Fronus X3-Genki three-phase hybrid inverter"
          width={800}
          height={800}
          priority
          className="lp-render lp-product-glow w-full h-auto"
          draggable={false}
        />
      </div>
    </section>
  );
}
