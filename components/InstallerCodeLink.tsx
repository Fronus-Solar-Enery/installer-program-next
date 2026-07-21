"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface InstallerCodeLinkProps {
  /** Installer document id — the route target. Falls back to plain text without it. */
  installerId?: string | null;
  code: string;
  className?: string;
  /** Optional label to show instead of the raw code (e.g. the installer name). */
  children?: React.ReactNode;
}

/**
 * An installer code rendered as a link to that installer.
 *
 * Used everywhere a code appears — rewards table, reward detail, search results
 * — so the code is always a way to get to the installer rather than dead text.
 */
export function InstallerCodeLink({
  installerId,
  code,
  className,
  children,
}: InstallerCodeLinkProps) {
  const label = children ?? code;

  if (!installerId) {
    return <span className={cn("font-mono", className)}>{label}</span>;
  }

  return (
    <Link
      href={`/installers/${installerId}`}
      // Stops the row's own click handler (edit/select) from firing too.
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "font-mono underline-offset-2 hover:underline hover:text-primary focus-visible:outline-2 focus-visible:outline-ring rounded-sm transition-colors",
        className,
      )}
      title={`View installer ${code}`}
    >
      {label}
    </Link>
  );
}
