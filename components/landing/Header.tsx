"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import ProgramLogo from "@/components/ProgramLogo";
import { IconWhatsapp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "../theme-toggle";

const easeStrong = [0.23, 1, 0.32, 1] as const;

const menuItem = {
  hidden: { opacity: 0, y: 32, filter: "blur(6px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.1 + i * 0.07,
      duration: 0.5,
      ease: easeStrong,
    },
  }),
  exit: { opacity: 0, y: 16, transition: { duration: 0.2 } },
};

export default function Header2026() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fullscreen menu open = lock body scroll behind it.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex justify-center">
        <motion.header
          initial={{ y: -24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 140,
            damping: 22,
            delay: 0.1,
          }}
          className={cn(
            "lp-nav-island mt-4 flex w-[92%] max-w-5xl items-center justify-between gap-4",
            "rounded-full squircle py-3 pl-6 pr-3 sm:pl-8",
            "transition-shadow duration-500 ease-fluid",
            scrolled && "shadow-lg",
          )}
        >
          <Link
            href="/"
            aria-label="Fronus Installer Program home"
            className="shrink-0"
          >
            <ProgramLogo className="w-24 h-8!" />
          </Link>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              asChild
              className="lp-magnetic hidden rounded-full bg-brand-900 text-white hover:bg-brand-1000 sm:inline-flex dark:bg-brand-700 dark:text-brand-1200 dark:hover:bg-brand-600"
            >
              <a
                href={buildWhatsAppUrl({ intent: "join", source: "header" })}
                {...WHATSAPP_LINK_ATTRS}
              >
                <IconWhatsapp fill className="mr-1.5 size-4" />
                Join on WhatsApp
              </a>
            </Button>
            <ThemeToggle />
          </div>
        </motion.header>
      </div>
    </>
  );
}
