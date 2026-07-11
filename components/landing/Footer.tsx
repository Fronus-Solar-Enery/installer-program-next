import Link from "next/link";
import ProgramLogo from "@/components/ProgramLogo";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";

/**
 * Minimal footer. The reward/WhatsApp narrative owns the page; the footer is
 * wayfinding + the SolaX partnership line for legitimacy.
 */
export default function Footer() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <ProgramLogo className="w-24 h-10!" />

          <nav
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
            aria-label="Footer"
          >
            <a
              href="#products"
              className="transition-colors hover:text-foreground"
            >
              Products
            </a>
            <a
              href="#how-it-works"
              className="transition-colors hover:text-foreground"
            >
              How it works
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
            <a
              href={buildWhatsAppUrl({ intent: "question", source: "footer" })}
              {...WHATSAPP_LINK_ATTRS}
              className="transition-colors hover:text-foreground"
            >
              Contact us
            </a>
            <Link
              href="/auth/installer"
              className="transition-colors hover:text-foreground"
            >
              Installer Login
            </Link>
            <Link
              href="/auth/signin"
              className="transition-colors hover:text-foreground"
            >
              Team Sign In
            </Link>
          </nav>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row">
          <p>
            Installer Program 2026 — run by Fronus Solar Energy in partnership
            with SolaX Power.
          </p>
          <p>Fronus &copy; {new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
