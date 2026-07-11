"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import ProgramLogo from "@/components/ProgramLogo";
import { IconWhatsapp } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#products", label: "Products" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#faq", label: "FAQ" },
];

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
            "rounded-full py-3 pl-6 pr-3 sm:pl-8",
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

          <nav className="hidden items-center gap-7 md:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors duration-300 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </nav>

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
            <button
              type="button"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(!mobileOpen)}
              className={cn(
                "flex size-10 flex-col items-center justify-center gap-[3.5px] rounded-full",
                "text-muted-foreground transition-colors hover:text-foreground md:hidden",
                mobileOpen && "lp-hamburger-open",
              )}
            >
              <span className="lp-hamburger-line" />
              <span className="lp-hamburger-line" />
              <span className="lp-hamburger-line" />
            </button>
          </div>
        </motion.header>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <div className="lp-menu-backdrop" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lp-menu-overlay"
            >
              <button
                type="button"
                aria-label="Close menu"
                onClick={closeMobile}
                className="lp-hamburger-open absolute right-4 top-6 flex size-11 flex-col items-center justify-center gap-[3.5px] rounded-full text-foreground"
              >
                <span className="lp-hamburger-line" />
                <span className="lp-hamburger-line" />
                <span className="lp-hamburger-line" />
              </button>
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={closeMobile}
                  custom={i}
                  variants={menuItem}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="lp-menu-link"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                custom={NAV_LINKS.length}
                variants={menuItem}
                initial="hidden"
                animate="show"
                exit="exit"
                className="mt-6 flex flex-col items-center gap-4"
              >
                <Button
                  size="lg"
                  asChild
                  className="lp-magnetic rounded-full bg-brand-900 text-white hover:bg-brand-1000 dark:bg-brand-700 dark:text-brand-1200 dark:hover:bg-brand-600"
                >
                  <a
                    href={buildWhatsAppUrl({
                      intent: "join",
                      source: "header-mobile",
                    })}
                    {...WHATSAPP_LINK_ATTRS}
                    onClick={closeMobile}
                  >
                    <IconWhatsapp fill className="mr-2 size-5" />
                    Join on WhatsApp
                  </a>
                </Button>
                <Link
                  href="/auth/installer"
                  onClick={closeMobile}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Login to Installer Portal
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
