"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authenticate } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ShadersBackground } from "@/components/ui/shaders-background";
import { cn } from "@/lib/utils";
import ProgramLogo from "@/components/ProgramLogo";
import { IconEye, IconLockPassword, IconSms } from "@/components/icons";
import Loading from "@/components/ui/loading";
import { ForgotPasswordDialog } from "@/components/ForgotPasswordDialog";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] =
    useState(false);

  // Check for error in URL params (NextAuth redirects with error)
  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      handleErrorMessage(decodeURIComponent(urlError));
    }
  }, [searchParams]);

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

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    if (value.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (emailError) {
      validateEmail(value);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (passwordError) {
      validatePassword(value);
    }
  };

  const handleErrorMessage = (errorMessage: string) => {
    // Reset all errors first
    setError("");
    setEmailError("");
    setPasswordError("");

    // Set field-specific errors based on message content
    if (
      errorMessage.toLowerCase().includes("no account found") ||
      errorMessage.toLowerCase().includes("email address") ||
      errorMessage.toLowerCase().includes("not registered")
    ) {
      setEmailError("This email is not registered");
    } else if (
      errorMessage.toLowerCase().includes("incorrect password") ||
      errorMessage.toLowerCase().includes("password is incorrect")
    ) {
      setPasswordError("Password is incorrect");
    } else if (errorMessage.toLowerCase().includes("password")) {
      // Generic password error
      setPasswordError(errorMessage);
    } else if (errorMessage.toLowerCase().includes("google sign")) {
      // Google Sign-In error
      setError(errorMessage);
    } else {
      // For other errors, show as general error
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setPasswordError("");

    // Validate both fields
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setLoading(true);

    try {
      const result = await authenticate(email.trim(), password);

      if (result.success) {
        window.location.href = "/dashboard";
      } else if (result.error) {
        handleErrorMessage(result.error);
      }
    } catch (err) {
      setError(
        "Unable to connect to the server. Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = (): void => {
    setShowPassword((prev) => {
      const newValue = !prev;
      return newValue;
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <ShadersBackground className="size-full" />
      <Card className="w-full max-w-md bg-card/20 backdrop-blur-sm">
        <CardHeader className="flex flex-col items-center gap-4">
          <ProgramLogo className="w-40 h-24!" />
          <div className="text-center">
            <CardTitle className="mb-2 text-2xl capitalize">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-balance text-zinc-500">
              Enter your Email & Password to access the Installer Program
              Management System
            </CardDescription>
          </div>
          <div className="w-3/4 my-3 border-muted/50 h-0.5 border-dashed border mb-4" />
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          <CardContent className="space-y-4 px-6!">
            {error && !emailError && !passwordError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  onBlur={() => email && validateEmail(email)}
                  placeholder="Enter your email"
                  className={cn(
                    "pl-10",
                    emailError
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  )}
                />
                <IconSms className="absolute -translate-y-1/2 top-1/2 left-3 size-4.5" />
              </div>
              {emailError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  onBlur={() => password && validatePassword(password)}
                  placeholder="Enter your password"
                  className={cn(
                    "pl-10",
                    passwordError
                      ? "border-destructive focus-visible:ring-destructive"
                      : ""
                  )}
                />
                <IconLockPassword className="absolute -translate-y-1/2 top-1/2 left-3 size-4.5" />
                <div className="select-none" onClick={toggleShowPassword}>
                  <IconEye className="absolute -translate-y-1/2 top-1/2 right-3 size-4.5 z-10 cursor-pointer text-muted-foreground/70 hover:text-muted-foreground transition-colors active:translate-y-[-45%]" />
                </div>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {passwordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !password || !email}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loading className="text-background" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2">
            <Button
              variant="link"
              className="p-0 h-max text-xs relative"
              type="button"
              onClick={() => setShowForgotPasswordDialog(true)}
            >
              Forgot password?
            </Button>
          </CardFooter>
        </form>

        <ForgotPasswordDialog
          open={showForgotPasswordDialog}
          onClose={() => setShowForgotPasswordDialog(false)}
        />

        <div className="py-4 pb-4 text-xs text-center text-muted-foreground">
          Fronus &copy; {new Date().getFullYear()} 
          <span className="text-muted">•</span> All rights reserved
        </div>
      </Card>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loading className="size-8" />
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
