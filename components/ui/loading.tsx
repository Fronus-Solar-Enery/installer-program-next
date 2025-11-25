"use client";
import { cn } from "@/lib/utils";

const Loading = ({
  className,
  stroke = 3,
}: {
  className?: string;
  stroke?: number | string;
}) => {
  return (
    <span aria-label="Loading..." role="status">
      <svg
        className={cn("size-3.5 animate-spin text-foreground", className)}
        viewBox="0 0 24 24"
      >
        <circle
          opacity="0.2"
          cx="12"
          cy="12"
          r="9"
          transform="rotate(-180 12 12)"
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
        />
        <path
          d="M6.76521 19.3072C8.24011 20.3636 10.0474 20.9854 12 20.9854C16.9706 20.9854 21 16.9559 21 11.9854"
          stroke="currentColor"
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};
export default Loading;
