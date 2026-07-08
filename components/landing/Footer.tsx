import Link from "next/link";
import ProgramLogo from "@/components/ProgramLogo";

export default function Footer() {
  return (
    <footer className="border-t border-border/50">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <ProgramLogo className="w-24" />

        <nav
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          aria-label="Footer"
        >
          <a
            href="#features"
            className="hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="hover:text-foreground transition-colors"
          >
            How it works
          </a>
          <Link
            href="/auth/installer"
            className="hover:text-foreground transition-colors"
          >
            Installer Login
          </Link>
          <Link
            href="/auth/signin"
            className="hover:text-foreground transition-colors"
          >
            Team Sign In
          </Link>
        </nav>

        <p className="text-xs text-muted-foreground">
          Fronus &copy; {new Date().getFullYear()} · All rights reserved
        </p>
      </div>
    </footer>
  );
}
