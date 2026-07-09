import { useClipboard } from "@/hooks/useCopyToClipboard";
import { IconCheck, IconCopy } from "./icons";
import type { MouseEventHandler } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
    <AnimatePresence mode="wait">
      {isCopied ? (
        <motion.div
          key="check"
          initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="inline-flex"
        >
          <IconCheck
            className={cn("ml-2 text-green-600 dark:text-green-400", className)}
          />
        </motion.div>
      ) : (
        <motion.div
          key="copy"
          initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="inline-flex"
        >
          <IconCopy
            onClick={handleClick}
            className={cn("ml-2 cursor-pointer", className)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
