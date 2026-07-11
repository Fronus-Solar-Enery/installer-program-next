"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { IconWhatsapp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";

/** Appears once the hero (with its own CTA) scrolls out of view. */
export default function FloatingWhatsApp() {
  const [visible, setVisible] = useState(false);

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
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              mass: 0.6,
            }}
            href={buildWhatsAppUrl({ intent: "join", source: "floating" })}
            {...WHATSAPP_LINK_ATTRS}
            aria-label="Join the Installer Program on WhatsApp"
            className="lp-glow-brand group flex items-center gap-2 rounded-full bg-brand-900 px-4 py-3.5 text-white transition-transform duration-200 hover:scale-105 active:scale-95 dark:bg-brand-700 dark:text-brand-1200"
          >
            <IconWhatsapp fill className="size-6 shrink-0" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold opacity-0 transition-all duration-300 group-hover:max-w-40 group-hover:opacity-100">
              Join &amp; earn Rs 5,000
            </span>
          </motion.a>
        )}
      </AnimatePresence>
    </div>
  );
}
