"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/CopyButton";
import { IconWhatsapp } from "@/components/icons";
import { toast } from "sonner";

interface PinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pin: string | null;
  whatsappMessage: string | null;
  whatsappUrl: string | null;
}

export default function PinDialog({
  open,
  onOpenChange,
  pin,
  whatsappMessage,
  whatsappUrl,
}: PinDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New PIN Generated</DialogTitle>
          <DialogDescription>
            {whatsappMessage
              ? "Auto-send is disabled — share manually via WhatsApp."
              : "This PIN has been sent via WhatsApp."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="flex items-center gap-2">
            <div className="select-all font-number text-4xl font-bold leading-none tracking-[0.25em]">
              {pin}
            </div>
            <CopyButton text={pin || ""} label="PIN" className="size-5!" />
          </div>
        </div>

        {whatsappMessage && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/50 p-3">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">
                {whatsappMessage}
              </pre>
            </div>
            <div className="flex gap-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-800"
                >
                  <IconWhatsapp className="size-3.5" fill />
                  Send on WhatsApp
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(whatsappMessage);
                  toast.success("Message copied to clipboard");
                }}
              >
                Copy Message
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
