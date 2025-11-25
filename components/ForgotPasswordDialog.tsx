"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import Loading from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { AnimatedOTPInput } from "@/components/ui/otp-input";
import { IconDangerCircle } from "./icons";

type Step = "email" | "pin" | "pinVerified" | "password" | "success";

interface ForgotPasswordDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ForgotPasswordDialog({
  open,
  onClose,
}: ForgotPasswordDialogProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pinError, setPinError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset all states when dialog closes
  const handleClose = () => {
    setStep("email");
    setEmail("");
    setPin("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setEmailError("");
    setPinError("");
    setPasswordError("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setLoading(false);
    onClose();
  };

  // Validate email
  const validateEmail = (value: string) => {
    if (!value.trim()) {
      setEmailError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Step 1: Request PIN
  const handleRequestPin = async () => {
    setError("");
    setEmailError("");

    if (!validateEmail(email)) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("pin");
        setError("");
      } else {
        setError(data.error || "Failed to send PIN. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify PIN (auto-triggered when PIN is complete)
  const handleVerifyPin = async (pinValue: string) => {
    setPinError("");
    setError("");

    if (!pinValue || pinValue.length !== 6) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          pin: pinValue.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show success message first
        setStep("pinVerified");
        setError("");

        // Auto-redirect to password step after 2 seconds
        setTimeout(() => {
          setStep("password");
        }, 2000);
      } else {
        setPinError(data.error || "Invalid PIN. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async () => {
    setError("");
    setPasswordError("");

    // Validate password
    if (!newPassword) {
      setPasswordError("Password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          pin: pin.trim(),
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("success");
        setError("");
      } else {
        setError(data.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        // Only allow closing via explicit user actions (Cancel/Close buttons)
        // Prevent closing on outside click or escape key
        if (!isOpen) {
          return;
        }
      }}
    >
      <DialogContent
        hideClose
        className="sm:max-w-[500px] rounded-3xl"
        onInteractOutside={(e) => {
          // Prevent closing when clicking outside
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing on Escape key
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {step === "email" && "Forgot Password?"}
            {step === "pin" && "Enter PIN"}
            {step === "pinVerified" && "PIN Verified!"}
            {step === "password" && "Reset Password"}
            {step === "success" && "Success!"}
          </DialogTitle>
          <DialogDescription>
            {step === "email" &&
              "Enter your email address and we'll send you a 6-digit PIN to reset your password."}
            {step === "pin" &&
              "We've sent a 6-digit PIN to your email. Please enter it below."}
            {step === "pinVerified" &&
              "Your PIN has been verified successfully!"}
            {step === "password" && "Create a new password for your account."}
            {step === "success" && "Your password has been reset successfully."}
          </DialogDescription>
        </DialogHeader>

        {/* Email Step */}
        {step === "email" && (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={() => email && validateEmail(email)}
                  placeholder="Enter your email"
                  className={cn(
                    "pl-10",
                    emailError &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                  autoFocus
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              {emailError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {emailError}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleRequestPin}
                disabled={loading || !email}
                className="rounded-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    Sending PIN...
                    <Loading className="size-5 text-background" />
                  </span>
                ) : (
                  "Get PIN"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* PIN Step */}
        {step === "pin" && (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                A 6-digit PIN has been sent to <strong>{email}</strong>. Please
                check your inbox and spam folder.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-center block">
                6-Digit PIN <span className="text-destructive">*</span>
              </Label>
              <div className="flex justify-center">
                <AnimatedOTPInput
                  maxLength={6}
                  value={pin}
                  onChange={(value) => {
                    setPin(value);
                    if (pinError) setPinError("");
                  }}
                  onComplete={(value) => {
                    setPin(value);
                    // Auto-verify when PIN is complete
                    handleVerifyPin(value);
                  }}
                  className={cn("", pinError && "border-destructive")}
                />
              </div>
              {pinError && (
                <p className="text-sm text-destructive-text-hover flex items-center justify-center gap-1">
                  <IconDangerCircle duotone />
                  {pinError}
                </p>
              )}
              {loading && (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loading className="w-4 h-4" />
                  Verifying PIN...
                </p>
              )}
              {!loading && (
                <p className="text-xs text-muted-foreground text-center">
                  PIN expires in 10 minutes
                </p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("email")}
                disabled={loading}
                className="rounded-full"
              >
                Back
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* PIN Verified Step */}
        {step === "pinVerified" && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">PIN Verified!</h3>
                <p className="text-sm text-muted-foreground">
                  Redirecting to password reset...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Password Step */}
        {step === "password" && (
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="newPassword">
                New Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Enter new password"
                  className={cn(
                    "pl-10 pr-10",
                    passwordError &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                  autoFocus
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                  placeholder="Confirm new password"
                  className={cn(
                    "pl-10 pr-10",
                    passwordError &&
                      "border-destructive focus-visible:ring-destructive"
                  )}
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Password must be at least 6 characters long
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setStep("pin")}
                disabled={loading}
                className="rounded-full"
              >
                Back
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={
                  loading ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword
                }
                className="rounded-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    Resetting...
                    <Loading className="size-5 text-background" />
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* Success Step */}
        {step === "success" && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-semibold text-lg">
                  Password Reset Successfully!
                </h3>
                <p className="text-sm text-muted-foreground">
                  You can now sign in with your new password.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full rounded-full">
                Sign In
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
