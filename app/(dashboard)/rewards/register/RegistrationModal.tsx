import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import {
  IconCheck,
  IconClose,
  IconBarcode,
  IconWhatsapp,
} from "@/components/icons";
import Loading from "@/components/ui/loading";
import { HyperText } from "@/components/ui/hypertext";
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
  serialNumber?: string;
  installerCode?: string;
  rewardAmount?: number;
  errorMessage?: string;
  onRedirect: () => void;
  onViewReward?: () => void;
  /** True when the claim-registered WhatsApp could not be delivered. */
  whatsappFailed?: boolean;
  deliveryMethod?: string | null;
  whatsappMessage?: string;
  whatsappUrl?: string;
}

const REGISTRATION_STEPS: RegistrationStep[] = [
  { id: "serial", label: "Validating Serial Number", weight: 0.25 },
  { id: "installer", label: "Checking Installer", weight: 0.22 },
  { id: "database", label: "Saving To Database", weight: 0.35 },
  { id: "finalize", label: "Finalizing Registration", weight: 0.18 },
];

export function RegistrationModal({
  open,
  onOpenChange,
  status,
  serialNumber,
  installerCode,
  rewardAmount,
  errorMessage,
  onRedirect,
  onViewReward,
  whatsappFailed,
  deliveryMethod,
  whatsappMessage,
  whatsappUrl,
}: RegistrationModalProps) {
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
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
  // Paused while the installer still needs to be messaged manually.
  useEffect(() => {
    if (status !== "success" || !open) return;
    if (whatsappFailed) return;

    if (countdown <= 0) {
      onRedirect();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, status, open, onRedirect, whatsappFailed]);

  const progressPercentage = ((5 - countdown) / 5) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        hideClose={true}
        // Registration outcome must be dismissed deliberately, not by a stray click.
        onInteractOutside={(e) => e.preventDefault()}
      >
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
                  Registering Reward
                </DialogTitle>
                <DialogDescription className="text-center">
                  Please wait while we process your reward registration
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
                    Reward Registered Successfully!
                  </DialogTitle>
                  <DialogDescription>
                    Reward has been registered successfully
                  </DialogDescription>
                </div>

                {/* Reward Details */}
                <div className="border border-border bg-muted/15 rounded-3xl p-4 space-y-3">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <IconBarcode className="size-18 text-primary" fill />
                    <span className="font-semibold text-lg">
                      {serialNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground tracking-wider">
                        Installer Code
                      </p>
                      <HyperText className="pointer-events-none leading-5 text-lg tracking-widest">
                        {installerCode as string}
                      </HyperText>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground tracking-wider">
                        Reward Amount
                      </p>
                      <p className="text-lg font-bold tracking-widest text-success-text">
                        Rs. {rewardAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp delivery status */}
                {deliveryMethod === "free-form" && (
                  <div className="bg-success/10 border border-success/30 rounded-2xl p-4 space-y-1">
                    <p className="text-sm font-medium text-success flex items-center justify-center gap-1.5">
                      <IconWhatsapp className="size-4" fill />
                      Claim confirmation sent via WhatsApp
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Delivered within the 24-hour window
                    </p>
                  </div>
                )}

                {/* Manual fallback — auto-send disabled or window shut */}
                {whatsappFailed && (
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3 text-left">
                    <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                      {deliveryMethod === "blocked"
                        ? "WhatsApp window expired — share manually"
                        : "Could not notify the installer on WhatsApp"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      The reward is registered. Send the confirmation yourself
                      so the installer knows the claim is on file.
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
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-brand-1000 text-white hover:bg-brand-1000/80 transition-colors"
                            >
                              <IconWhatsapp className="size-3.5" fill />
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
                  </div>
                )}

                {/* Countdown — hidden while the message still needs sending */}
                {!whatsappFailed && (
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
                  {onViewReward && (
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={onViewReward}
                    >
                      View Reward
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
                    The reward could not be registered. Please check the error
                    details below:
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
                        reward. Please try again or contact support.
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
