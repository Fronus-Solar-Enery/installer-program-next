import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { IconCheck, IconClose, IconUserOctagon } from "@/components/icons";
import Loading from "@/components/ui/loading";
import { HyperText } from "@/components/ui/hypertext";
import { CopyButton } from "@/components/CopyButton";
import { toast } from "sonner";

interface RegistrationStep {
  id: string;
  label: string;
  weight: number; // Weight determines how much of total progress this step takes
}

interface RegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: "registering" | "success" | "error";
  installerCode?: string;
  installerName?: string;
  errorMessage?: string;
  onRedirect: () => void;
  onViewInstaller?: () => void;
  whatsappFailed?: boolean;
  whatsappMessage?: string;
  whatsappUrl?: string;
  pin?: string | null;
  onResendPin?: () => Promise<boolean>;
}

const REGISTRATION_STEPS: RegistrationStep[] = [
  { id: "cnic", label: "Checking CNIC", weight: 0.25 },
  { id: "code", label: "Checking Installer Code", weight: 0.22 },
  { id: "database", label: "Saving To Database", weight: 0.35 },
  { id: "finalize", label: "Finalizing Registration", weight: 0.18 },
];

export function RegistrationModal({
  open,
  onOpenChange,
  status,
  installerCode,
  installerName,
  errorMessage,
  onRedirect,
  onViewInstaller,
  whatsappFailed,
  whatsappMessage,
  whatsappUrl,
  pin,
  onResendPin,
}: RegistrationModalProps) {
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [resending, setResending] = useState(false);
  const [pinResent, setPinResent] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open && status === "registering") {
      setProgress(0);
      setCountdown(5);
      startTimeRef.current = Date.now();
    }
  }, [open, status]);

  // Smooth progress animation that syncs with API time
  useEffect(() => {
    if (status !== "registering" || !open) {
      // When status changes to success/error, ensure progress reaches 100%
      if (status === "success" || status === "error") {
        setProgress(100);
      }
      return;
    }

    startTimeRef.current = Date.now();

    // Expected API time is typically 1-2 seconds
    // We'll animate smoothly to reach 95% at around 2 seconds
    // This gives a buffer for slower API calls
    const EXPECTED_DURATION = 2000; // 2 seconds
    const TARGET_PROGRESS = 95; // Leave 5% for completion

    const animate = () => {
      if (!startTimeRef.current) return;

      const elapsed = Date.now() - startTimeRef.current;

      // Use smooth ease-out curve that reaches target naturally
      // Formula: progress = target * (1 - e^(-3*t/duration))
      // This reaches ~95% of target at duration time
      const normalizedTime = elapsed / EXPECTED_DURATION;
      const easedProgress =
        TARGET_PROGRESS * (1 - Math.exp(-3 * normalizedTime));

      setProgress(Math.min(easedProgress, TARGET_PROGRESS));

      // Continue animation only while registering
      if (status === "registering") {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [status, open]);

  // Handle countdown for success state.
  // Paused while the PIN failed to deliver, so the user can hit Resend.
  useEffect(() => {
    if (status !== "success" || !open || (whatsappFailed && !pinResent))
      return;

    if (countdown <= 0) {
      onRedirect();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, status, open, onRedirect, whatsappFailed, pinResent]);

  const progressPercentage = ((5 - countdown) / 5) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" hideClose={true}>
        <AnimatePresence mode="wait">
          {/* Registering State */}
          {status === "registering" && (
            <motion.div
              key="registering"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <DialogHeader>
                <DialogTitle className="text-2xl text-center">
                  Registering Installer
                </DialogTitle>
                <DialogDescription className="text-center">
                  Please wait while we process your registration
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <Progress value={progress} className="h-2" />

                <div className="space-y-2">
                  {REGISTRATION_STEPS.map((step, index) => {
                    // Calculate cumulative weight up to this step
                    const cumulativeWeight = REGISTRATION_STEPS.slice(
                      0,
                      index,
                    ).reduce((sum, s) => sum + s.weight, 0);
                    const stepThreshold = cumulativeWeight * 100;
                    const stepEndThreshold =
                      (cumulativeWeight + step.weight) * 100;

                    const isCompleted = progress > stepEndThreshold;
                    const isCurrent =
                      progress >= stepThreshold && progress <= stepEndThreshold;
                    const isPending = progress < stepThreshold;

                    // Calculate progress for current step (0-100)
                    const stepProgress = isCurrent
                      ? Math.min(
                          ((progress - stepThreshold) / (step.weight * 100)) *
                            100,
                          100,
                        )
                      : 0;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "relative flex items-center gap-3 p-3 rounded-2xl overflow-hidden border border-border/40 bg-muted/10 transition-colors duration-300",
                          isCompleted && "border-transparent bg-success/5",
                        )}
                      >
                        {/* Animated progress bar background for current step */}
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 bg-primary/5 rounded-r-lg"
                            style={{ width: `${stepProgress}%` }}
                            transition={{ duration: 0.1, ease: "linear" }}
                          />
                        )}

                        {/* Content */}
                        <div className="relative flex items-center gap-3 w-full">
                          <div
                            className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300",
                              isCompleted && "bg-success/20 text-success-text",
                              isCurrent &&
                                "bg-primary/10 text-primary-foreground",
                              isPending && "bg-muted text-muted-foreground",
                            )}
                          >
                            {isCompleted ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <IconCheck className="w-5 h-5" />
                              </motion.div>
                            ) : isCurrent ? (
                              <Loading className="fill-background" />
                            ) : (
                              <span className="text-sm font-medium">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium transition-colors duration-300",
                              isCompleted && "text-success-text",
                              isCurrent && "text-foreground",
                              isPending && "text-muted-foreground",
                            )}
                          >
                            {step.label}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 py-4"
            >
              <div className="space-y-4 text-center">
                {/* Success Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="mx-auto w-20 h-20 rounded-full bg-success/20 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center">
                    <IconCheck className="w-10 h-10 text-success-foreground" />
                  </div>
                </motion.div>

                {/* Success Message */}
                <div className="space-y-2 mb-6">
                  <DialogTitle className="text-2xl font-bold text-success-text">
                    Successful!
                  </DialogTitle>
                  <DialogDescription>
                    Installer has been registered successfully
                  </DialogDescription>
                </div>

                {/* Installer Details */}
                <div className="border border-border bg-muted/15 rounded-3xl p-4 space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <IconUserOctagon className="size-18 text-primary" fill />
                    <span className="font-semibold text-lg">
                      {installerName}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground tracking-wider">
                      Installer Code
                    </p>
                    <HyperText className="pointer-events-none leading-5 text-2xl tracking-widest">
                      {installerCode as string}
                    </HyperText>
                  </div>
                </div>

                {/* PIN display */}
                {pin && (
                  <div className="border border-brand-700/30 bg-brand-400/30 dark:bg-brand-1100/30 rounded-2xl p-4 space-y-2">
                    <p className="text-xs text-muted-foreground tracking-wider">
                      Login PIN
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-3xl font-mono font-bold tracking-[0.2em] select-all">
                        {pin}
                      </p>
                      <CopyButton text={pin} label="PIN" />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Save this PIN now — it won't be shown again.
                    </p>
                  </div>
                )}

                {/* PIN delivery warning / manual share */}
                {whatsappFailed && !pinResent && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3 text-left">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {whatsappMessage
                        ? "Auto-send is disabled — share manually"
                        : "Could not send login PIN via WhatsApp"}
                    </p>
                    {whatsappMessage && (
                      <div className="bg-background/60 border border-border rounded-xl p-3 space-y-2">
                        <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                          {whatsappMessage}
                        </pre>
                        <div className="flex gap-2 pt-1">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#25D366] text-white hover:bg-[#1da851] transition-colors"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              Send on WhatsApp
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(whatsappMessage);
                              toast.success("Message copied to clipboard");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                          >
                            Copy Text
                          </button>
                        </div>
                      </div>
                    )}
                    {!whatsappMessage && (
                      <p className="text-xs text-muted-foreground">
                        The installer needs this PIN to sign in. Click Resend to
                        generate and send a new PIN.
                      </p>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={resending || !onResendPin}
                      onClick={async () => {
                        if (!onResendPin) return;
                        setResending(true);
                        const ok = await onResendPin();
                        setResending(false);
                        if (ok) setPinResent(true);
                      }}
                    >
                      {resending ? "Resending…" : "Resend PIN"}
                    </Button>
                  </div>
                )}

                {/* Countdown — hidden while PIN delivery needs attention */}
                {!(whatsappFailed && !pinResent) && (
                  <div className="space-y-3">
                    <div className="relative">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-primary"
                          initial={{ width: "0%" }}
                          animate={{ width: `${progressPercentage}%` }}
                          transition={{ duration: 1, ease: "linear" }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Redirecting in{" "}
                      <span className="font-bold text-foreground">
                        {countdown}
                      </span>{" "}
                      {countdown === 1 ? "second" : "seconds"}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  {onViewInstaller && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onViewInstaller}
                    >
                      View Installer
                    </Button>
                  )}
                  <Button className="flex-1" onClick={onRedirect}>
                    Register Another
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Error State */}
          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 py-4"
            >
              <div className="space-y-4 text-center">
                {/* Error Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  className="mx-auto w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-full bg-destructive flex items-center justify-center">
                    <IconClose className="w-10 h-10 text-destructive-foreground" />
                  </div>
                </motion.div>

                {/* Error Message */}
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-destructive">
                    Registration Failed
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    The installer could not be registered. Please check the
                    error details below:
                  </DialogDescription>
                </div>

                {/* Error Details */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-left max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {errorMessage?.split("\n").map((line, index) => (
                      <div
                        key={index}
                        className="text-sm text-destructive-text leading-relaxed"
                      >
                        {line}
                      </div>
                    )) || (
                      <div className="text-sm text-destructive-text">
                        ⚠️ An unexpected error occurred while registering the
                        installer. Please try again or contact support.
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => onOpenChange(false)}
                  >
                    Close
                  </Button>
                  <Button className="flex-1" onClick={onRedirect}>
                    Try Again
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
