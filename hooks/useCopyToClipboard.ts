import { useCallback, useEffect, useRef, useState } from "react";
import { toast as defaultToast } from "sonner";

interface UseClipboardOptions {
  timeout?: number; // ms to clear copied state (0 = never)
  successMessage?: string | ((text: string, label?: string) => string);
  errorMessage?: string | ((err?: unknown) => string);
  onCopy?: (text: string, label?: string) => void;
  toast?: {
    success: (msg: string) => void;
    error: (msg: string) => void;
  };
}

/**
 * useClipboard
 * - stable API, fallback for older browsers, cleans up timers on unmount,
 * - returns the last-copied label (or text) or null and a typed copy fn.
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const {
    timeout = 2000,
    successMessage,
    errorMessage = () => "Failed to copy to clipboard",
    onCopy,
    toast = defaultToast,
  } = options;

  const [copied, setCopied] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  const _formatSuccess = useCallback(
    (text: string, label?: string) =>
      typeof successMessage === "function"
        ? successMessage(text, label)
        : successMessage ??
          `Copied ${
            text.length > 40 ? `${text.slice(0, 37)}...` : text
          } to clipboard`,
    [successMessage]
  );

  const _formatError = useCallback(
    (err?: unknown) =>
      typeof errorMessage === "function" ? errorMessage(err) : errorMessage,
    [errorMessage]
  );

  const _clearPreviousTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const _fallbackCopy = (text: string) => {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    // Avoid scrolling to bottom
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.setAttribute("readonly", "true");
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    let succeeded = false;
    try {
      succeeded = document.execCommand("copy");
    } catch {
      succeeded = false;
    } finally {
      document.body.removeChild(textarea);
    }
    return succeeded;
  };

  const copyToClipboard = useCallback(
    async (text: string, label?: string): Promise<boolean> => {
      _clearPreviousTimeout();

      try {
        let ok = false;
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          ok = true;
        } else {
          ok = _fallbackCopy(text);
        }

        if (!ok) throw new Error("Copy command failed");

        const displayLabel = label ?? text;
        setCopied(displayLabel);
        try {
          toast.success(_formatSuccess(text, label));
        } catch {
          // swallow toast errors to not break copy flow
        }
        onCopy?.(text, label);

        if (timeout > 0) {
          timeoutRef.current = window.setTimeout(() => {
            setCopied(null);
            timeoutRef.current = null;
          }, timeout);
        }

        return true;
      } catch (err) {
        try {
          toast.error(_formatError(err));
        } catch {
          // ignore toast errors
        }
        // keep copied state unchanged on failure
        // log for debugging
        // eslint-disable-next-line no-console
        console.error("useClipboard: copy failed", err);
        return false;
      }
    },
    [
      _clearPreviousTimeout,
      onCopy,
      timeout,
      _formatSuccess,
      _formatError,
      toast,
    ]
  );

  const reset = useCallback(() => {
    _clearPreviousTimeout();
    setCopied(null);
  }, [_clearPreviousTimeout]);

  return {
    copied,
    copyToClipboard,
    reset,
  } as const;
}
