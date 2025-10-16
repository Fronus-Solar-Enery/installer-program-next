import { useState } from "react";
import { toast } from "sonner";

export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string): Promise<boolean> => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      toast.success(`Copied ${text} to clipboard`);

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedText(null);
      }, 2000);

      return true;
    } catch (error) {
      console.warn("Copy failed", error);
      setCopiedText(null);
      return false;
    }
  };

  return { copiedText, copyToClipboard };
}
