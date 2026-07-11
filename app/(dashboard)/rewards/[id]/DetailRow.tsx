"use client";

import { CopyButton } from "@/components/CopyButton";
import { cn } from "@/lib/utils";

interface DetailRowProps {
  label: string;
  value?: string | number | null;
  mono?: boolean;
  copyLabel?: string;
  valueClassName?: string;
  children?: React.ReactNode;
}

export default function DetailRow({
  label,
  value,
  mono,
  copyLabel,
  valueClassName,
  children,
}: DetailRowProps) {
  const hasValue = value !== undefined && value !== null && value !== "";

  return (
    <div className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "flex min-w-0 items-center gap-1.5 text-right text-sm",
          mono && "font-mono",
          !hasValue && !children && "text-muted-foreground/60",
          valueClassName,
        )}
      >
        {children ?? (
          <>
            <span className="truncate">{hasValue ? value : "N/A"}</span>
            {hasValue && copyLabel && (
              <CopyButton text={String(value)} label={copyLabel} />
            )}
          </>
        )}
      </dd>
    </div>
  );
}
