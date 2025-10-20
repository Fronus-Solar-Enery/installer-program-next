import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseClipboardOptions {
  timeout?: number;
  onSuccess?: (text: string, label: string) => void;
  onError?: (error: unknown) => void;
}

/**
 * A React hook that provides clipboard functionality with visual feedback
 */
export function useClipboard(options: UseClipboardOptions = {}) {
  const { timeout = 2000, onSuccess, onError } = options;
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const copyToClipboard = useCallback(
    async (text: string, label: string = "Text") => {
      setIsLoading(true);
      setError(null);

      try {
        const success = await copyUtil(text, label, {
          onSuccess: () => {
            if (onSuccess) onSuccess(text, label);
          },
          onError: (err) => {
            if (onError) onError(err);
            setError(err instanceof Error ? err : new Error("Failed to copy"));
          },
        });

        if (success) {
          setCopied(label);
          if (timeout) {
            setTimeout(() => setCopied(null), timeout);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to copy"));
        if (onError) onError(err);
      } finally {
        setIsLoading(false);
      }
    },
    [timeout, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setCopied(null);
    setError(null);
  }, []);

  return {
    copied,
    error,
    isLoading,
    copyToClipboard,
    reset,
  };
}

/**
 * Enhanced copy to clipboard with visual feedback and error handling
 * This version doesn't use React hooks, making it safe to use anywhere
 */
export function copyUtil(
  text: string,
  label: string = "Text",
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: () => void;
    onError?: (error: unknown) => void;
  }
): Promise<boolean> {
  const defaultOptions = {
    successMessage: `${label} copied to clipboard`,
    errorMessage: "Failed to copy to clipboard",
    onSuccess: () => {},
    onError: (error: unknown) => console.error("Copy error:", error),
  };

  const opts = { ...defaultOptions, ...options };

  // Determine which clipboard API to use based on environment and availability
  // This provides better compatibility across different browsers and platforms
  let copyPromise: Promise<void>;

  // Use the most modern API available
  if (
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    copyPromise = navigator.clipboard.writeText(text);
  } else {
    // Fallback for older browsers
    copyPromise = new Promise((resolve, reject) => {
      try {
        // Create temporary element
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Make it invisible but part of the document
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);

        // Select and copy
        textArea.select();
        const success = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (success) {
          resolve();
        } else {
          reject(new Error("execCommand returned false"));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  // Handle the copy operation and provide feedback
  return copyPromise
    .then(() => {
      toast.success(opts.successMessage, {
        description: text.length > 40 ? `${text.substring(0, 37)}...` : text,
        duration: 2000,
      });
      opts.onSuccess();
      return true;
    })
    .catch((error) => {
      toast.error(opts.errorMessage, {
        description: "Please try manually selecting and copying the text.",
        duration: 3000,
      });
      opts.onError(error);
      return false;
    });
}
