"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconWhatsapp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";

/** Appears once the hero (with its own CTA) scrolls out of view. */
export default function FloatingWhatsApp() {
  const [visible, setVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
            initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{ opacity: 0, y: 12, filter: "blur(6px)" }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            href={buildWhatsAppUrl({ intent: "join", source: "floating" })}
            {...WHATSAPP_LINK_ATTRS}
            aria-label="Join the Installer Program on WhatsApp"
            className="lp-glow-brand group flex items-center gap-2 rounded-full bg-brand-900 px-3.5 py-3.5 text-white dark:bg-brand-700 dark:text-brand-1200"
          >
            <IconWhatsapp fill className="size-6 shrink-0" />
            <motion.span
              animate={isHovered ? "hover" : "rest"}
              variants={{
                rest: {
                  display: "none",
                  maxWidth: 0,
                  opacity: 0,
                  filter: "blur(6px)",
                },
                hover: {
                  display: "block",
                  maxWidth: "10rem",
                  opacity: 1,
                  filter: "blur(0px)",
                  paddingRight: "0.5rem",
                },
              }}
              transition={{ duration: 0.7, ease: [0.7, 0, 0.2, 1] }}
              className="overflow-hidden whitespace-nowrap text-sm font-semibold hidden"
            >
              Join &amp; earn Rs 5,000
            </motion.span>
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
