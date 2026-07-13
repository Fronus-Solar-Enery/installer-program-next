"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { IconWhatsapp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

/** Appears once the hero (with its own CTA) scrolls out of view. */
export default function FloatingWhatsApp() {
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    const hero = document.getElementById("lp-hero");
    if (!hero) {
      const timer = setTimeout(() => setVisible(true), 0);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-50 sm:bottom-7 sm:right-7">
      <AnimatePresence>
        {visible && (
          <motion.a
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(6px)" }}
            transition={{ duration: 0.25, ease: EASE_OUT }}
            href={buildWhatsAppUrl({ intent: "join", source: "floating" })}
            {...WHATSAPP_LINK_ATTRS}
            aria-label="Join the Installer Program on WhatsApp"
            className="lp-glow-brand group flex items-center rounded-full bg-brand-900 px-3.5 py-3.5 text-white dark:bg-brand-700 dark:text-brand-1200"
          >
            <IconWhatsapp fill className="size-6 shrink-0" />
            {/* ponytail: animating width/padding is a layout animation, but it's the
                only reliable collapse-and-reclaim reveal (grid 0fr→1fr fails in an
                auto-width container; transforms can't reclaim space) and it runs on
                one low-freq hover only. */}
            <motion.span
              initial="rest"
              animate={isHovered ? "hover" : "rest"}
              variants={{
                rest: { width: 0, paddingLeft: 0, paddingRight: 0, opacity: 0, filter: "blur(4px)" },
                hover: { width: "auto", paddingLeft: "0.5rem", paddingRight: "0.25rem", opacity: 1, filter: "blur(0px)" },
              }}
              transition={{ duration: reduce ? 0 : 0.2, ease: EASE_OUT }}
              className="overflow-hidden whitespace-nowrap text-sm font-semibold"
            >
              Join &amp; earn Rs 5,000
            </motion.span>
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
