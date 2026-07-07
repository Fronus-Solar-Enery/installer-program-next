"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { IconWhatsapp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { EASE_ENTER } from "@/lib/gsapEases";

if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP, ScrollTrigger);
}

/**
 * Persistent WhatsApp button. Hidden until the hero scrolls out of view, then
 * slides in (EASE_ENTER) so it never competes with the primary hero CTA.
 * One tap from conversion, anywhere on the page.
 */
export default function FloatingWhatsApp() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Reduced motion: just show it immediately, no scroll-pinning logic.
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(containerRef.current, { autoAlpha: 1, y: 0 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(containerRef.current, { autoAlpha: 0, y: 24 });

        const hero = document.getElementById("lp-hero");
        if (!hero) {
          // No hero anchor — just reveal after a short delay.
          gsap.to(containerRef.current, {
            autoAlpha: 1,
            y: 0,
            duration: 0.6,
            delay: 2,
            ease: EASE_ENTER,
          });
          return;
        }

        ScrollTrigger.create({
          trigger: hero,
          start: "bottom 80%",
          onEnter: () =>
            gsap.to(containerRef.current, {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              ease: EASE_ENTER,
            }),
          onLeaveBack: () =>
            gsap.to(containerRef.current, {
              autoAlpha: 0,
              y: 24,
              duration: 0.4,
              ease: EASE_ENTER,
            }),
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7"
    >
      <a
        href={buildWhatsAppUrl({ intent: "join", source: "floating" })}
        {...WHATSAPP_LINK_ATTRS}
        aria-label="Join the Installer Program on WhatsApp"
        className="group flex items-center gap-2 rounded-full bg-brand-900 px-4 py-3 text-brand-100 transition-transform duration-500 ease-fluid hover:scale-105 active:scale-95"
      >
        <IconWhatsapp fill className="size-6 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-500 ease-fluid group-hover:max-w-40 group-hover:opacity-100">
          Join &amp; earn Rs 5,000
        </span>
      </a>
    </div>
  );
}
