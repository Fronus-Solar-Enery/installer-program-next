"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/button";
import { IconWhatsapp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { EASE_ENTER } from "@/lib/gsapEases";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

export default function FinalCTA() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(".lp-final-word", { opacity: 1, y: 0 });
        return;
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(".lp-final-word", {
          autoAlpha: 0,
          y: 40,
          duration: 0.7,
          ease: EASE_ENTER,
          stagger: 0.08,
          scrollTrigger: {
            trigger: root.current,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        });
      });
    },
    { scope: root },
  );

  const headlineWords = ["Your", "next", "install", "is", "worth", "5,000 PKR"];

  return (
    <section
      ref={root}
      className="relative flex min-h-[80vh] items-center justify-center overflow-hidden border-t border-border/40 px-4 py-24"
    >
      <div className="flex flex-col items-center gap-8 text-center">
        <h2 className="font-display max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight text-balance sm:text-6xl">
          {headlineWords.map((w, i) => (
            <span
              key={i}
              className={`lp-final-word mr-[0.25em] inline-block ${
                w === "5,000 PKR" ? "text-brand-800 font-number" : ""
              }`}
            >
              {w}
            </span>
          ))}
        </h2>

        <p className="max-w-lg text-muted-foreground text-balance">
          Join the Fronus Installer Program. Get your code on WhatsApp in
          minutes. Start earning today.
        </p>

        <Button size="lg" asChild className="text-base sm:text-lg rounded-full">
          <a
            href={buildWhatsAppUrl({ intent: "join", source: "final-cta" })}
            {...WHATSAPP_LINK_ATTRS}
          >
            <IconWhatsapp fill className="mr-2 size-5" />
            Join the Installer Program
          </a>
        </Button>
      </div>
    </section>
  );
}
