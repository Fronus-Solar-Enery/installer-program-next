"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import ProgramLogo from "@/components/ProgramLogo";
import { IconWhatsapp, IconClose } from "@/components/icons";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#products", label: "Products" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#testimonials", label: "Testimonials" },
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
            "mt-4 flex items-center justify-between gap-4 backdrop-blur-2xl",
            "rounded-full px-8 py-4",
            "transition-all duration-500 ease-fluid",
            scrolled
              ? "lp-nav-island w-[90%] max-w-5xl shadow-lg"
              : "lp-nav-island w-[90%] max-w-5xl",
          )}
        >
          <Link
            href="/"
            aria-label="Fronus Installer Program home"
            className="shrink-0"
          >
            <ProgramLogo className="w-24 h-8!" />
          </Link>
          {/* 
          <nav className="hidden md:flex items-center gap-8" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-brand-600 transition-colors duration-300"
              >
                {link.label}
              </a>
            ))}
          </nav> */}

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              asChild
              className="hidden sm:inline-flex rounded-full lp-magnetic"
            >
              <a
                href={buildWhatsAppUrl({ intent: "join", source: "header" })}
                {...WHATSAPP_LINK_ATTRS}
              >
                <IconWhatsapp fill className="mr-1.5 size-4" />
                Join Now
              </a>
            </Button>
            <button
              type="button"
              aria-label="Toggle menu"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`
                flex md:hidden flex-col items-center justify-center gap-[3.5px]
                size-9 rounded-full
                text-muted-foreground hover:text-foreground transition-colors
                ${mobileOpen ? "lp-hamburger-open" : ""}
              `}
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
              ref={menuRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lp-menu-overlay"
            >
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
                <Button size="lg" asChild className="rounded-full lp-magnetic">
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
                  href="/auth/signin"
                  onClick={closeMobile}
                  className="text-sm text-muted-foreground hover:text-brand-600 transition-colors"
                >
                  Sign In
                </Link>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
