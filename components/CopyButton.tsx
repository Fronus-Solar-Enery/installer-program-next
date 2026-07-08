import React from "react";
import { useClipboard } from "@/hooks/useCopyToClipboard";
import { IconCheck, IconCopy } from "./icons";
import type { MouseEventHandler } from "react";
import { cn } from "@/lib/utils";

export const CopyButton = ({
  text,
  label,
  className,
  onClick,
}: {
  text?: string;
  label?: string;
  className?: string;
  onClick?: MouseEventHandler<SVGSVGElement>;
}) => {
  const { copyToClipboard, copied } = useClipboard();

  const handleClick: MouseEventHandler<SVGSVGElement> = (e) => {
    // prevent parent Link navigation
    e.stopPropagation();
    e.preventDefault();

    // allow parent to run side-effects (analytics, toasts, etc.)
    if (onClick) onClick(e);

    // always trigger this component's copy so `copied` (local) updates and the check shows
    if (text) void copyToClipboard(text);
  };

  const isCopied = Boolean(text && copied === text);

  return (
    <>
      {isCopied ? (
        <IconCheck
          className={cn("ml-2 text-green-600 dark:text-green-300", className)}
        />
      ) : (
        <IconCopy
          onClick={handleClick}
          className={cn("ml-2 cursor-pointer", className)}
        />
      )}
    </>
  );
};
