import { useEffect, useState } from "react";
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
import { IconCheck, IconClose, IconBarcode } from "@/components/icons";
import Loading from "@/components/ui/loading";

interface RegistrationStep {
  id: string;
  label: string;
  duration: number;
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
}

const REGISTRATION_STEPS: RegistrationStep[] = [
  { id: "serial", label: "Validating Serial Number", duration: 800 },
  { id: "installer", label: "Checking Installer", duration: 700 },
  { id: "database", label: "Saving To Database", duration: 1000 },
  { id: "finalize", label: "Finalizing Registration", duration: 600 },
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
}: RegistrationModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState(5);
  const [isCompleted, setIsCompleted] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (open && status === "registering") {
      setCurrentStep(0);
      setProgress(0);
      setIsCompleted(false);
      setCountdown(5);
    }
  }, [open, status]);

  // Handle progress animation
  useEffect(() => {
    if (status !== "registering" || !open) return;

    if (currentStep >= REGISTRATION_STEPS.length) {
      setIsCompleted(true);
      return;
    }

    const step = REGISTRATION_STEPS[currentStep];
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const stepProgress = Math.min((elapsed / step.duration) * 100, 100);

      const completedSteps = currentStep;
      const totalProgress =
        (completedSteps * 100 + stepProgress) / REGISTRATION_STEPS.length;

      setProgress(totalProgress);

      if (elapsed >= step.duration) {
        setCurrentStep((prev) => prev + 1);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [currentStep, status, open]);

  // Handle countdown for success state
  useEffect(() => {
    if (status !== "success" || !open) return;

    if (countdown <= 0) {
      onRedirect();
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, status, open, onRedirect]);

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
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isPending = index > currentStep;

                    // Calculate progress for current step
                    const stepProgress = isCurrent
                      ? ((progress * REGISTRATION_STEPS.length - index * 100) /
                          100) *
                        100
                      : 0;

                    return (
                      <motion.div
                        key={step.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                          "relative flex items-center gap-3 p-3 rounded-2xl overflow-hidden",
                          isCompleted && "bg-primary/5"
                        )}
                      >
                        {/* Animated progress bar background for current step */}
                        {isCurrent && (
                          <motion.div
                            className="absolute inset-0 bg-primary/5"
                            initial={{ width: "0%" }}
                            animate={{ width: `${stepProgress}%` }}
                            transition={{ duration: 0.05, ease: "linear" }}
                          />
                        )}

                        {/* Content */}
                        <div className="relative flex items-center gap-3 w-full">
                          <div
                            className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full transition-colors",
                              isCompleted && "bg-success/20 text-success-text",
                              isCurrent && "bg-primary text-primary-foreground",
                              isPending && "bg-muted text-muted-foreground"
                            )}
                          >
                            {isCompleted ? (
                              <IconCheck className="w-5 h-5" duotone={false} />
                            ) : isCurrent ? (
                              <Loading className="w-4 h-4 text-background" />
                            ) : (
                              <span className="text-sm font-medium">
                                {index + 1}
                              </span>
                            )}
                          </div>
                          <span
                            className={cn(
                              "text-sm font-medium transition-colors",
                              isCompleted && "text-success-text",
                              isCurrent && "text-foreground",
                              isPending && "text-muted-foreground"
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
                    <IconCheck
                      className="w-10 h-10 text-success-foreground"
                      duotone={false}
                    />
                  </div>
                </motion.div>

                {/* Success Message */}
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-success-text">
                    Reward Registered Successfully!
                  </DialogTitle>
                  <DialogDescription>
                    Reward has been registered successfully
                  </DialogDescription>
                </div>

                {/* Reward Details */}
                <div className="bg-muted/50 rounded-3xl p-4 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <IconBarcode className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-lg">
                      {serialNumber}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Installer Code
                      </p>
                      <p className="text-lg font-mono font-bold tracking-wider text-primary">
                        {installerCode}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Reward Amount
                      </p>
                      <p className="text-lg font-bold tracking-wider text-green-600">
                        Rs. {rewardAmount?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Countdown */}
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
                    <IconClose
                      className="w-10 h-10 text-destructive-foreground"
                      duotone={false}
                    />
                  </div>
                </motion.div>

                {/* Error Message */}
                <div className="space-y-2">
                  <DialogTitle className="text-2xl font-bold text-destructive">
                    Registration Failed
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Please review the errors below and try again
                  </DialogDescription>
                </div>

                {/* Error Details */}
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-left max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {errorMessage?.split("\n").map((line, index) => (
                      <div
                        key={index}
                        className="text-sm text-destructive-text font-mono"
                      >
                        {line}
                      </div>
                    )) || (
                      <div className="text-sm text-destructive-text">
                        An error occurred while registering the reward
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
