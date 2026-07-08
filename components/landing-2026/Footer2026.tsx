import Link from "next/link";
import ProgramLogo from "@/components/ProgramLogo";
import { buildWhatsAppUrl, WHATSAPP_LINK_ATTRS } from "@/lib/whatsapp";

/**
 * Minimal footer. The reward/WhatsApp narrative owns the page; the footer is
 * just wayfinding + legal. Existing login/signin links are preserved here as
 * small text links so registered installers and team members aren't stranded.
 */
export default function Footer2026() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 py-6 sm:flex-row">
        <ProgramLogo className="w-20 h-10!" />

        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          aria-label="Footer"
        >
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

        <p className="text-xs text-muted-foreground">
          Fronus &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
