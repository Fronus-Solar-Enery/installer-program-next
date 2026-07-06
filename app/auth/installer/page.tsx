"use client";

import { useState } from "react";
import Link from "next/link";
import { installerLogin } from "./actions";
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
import { IconLockPassword, IconUserOctagon } from "@/components/icons";
import Loading from "@/components/ui/loading";

export default function InstallerLoginPage() {
  const [installerCode, setInstallerCode] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!installerCode.trim()) {
      setError("Installer code is required");
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      const result = await installerLogin(installerCode.trim(), pin);
      if (result.success) {
        window.location.href = "/my-stats";
      } else {
        setError(result.error || "Sign in failed");
      }
    } catch {
      setError(
        "Unable to connect to the server. Please check your internet connection."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <ShadersBackground className="size-full" />
      <Card className="w-full max-w-md bg-card/20 backdrop-blur-sm">
        <CardHeader className="flex flex-col items-center gap-4">
          <ProgramLogo className="w-40 h-24!" />
          <div className="text-center">
            <CardTitle className="mb-2 text-2xl">Installer Login</CardTitle>
            <CardDescription className="text-balance text-zinc-500">
              Enter your Installer Code and the 6-digit PIN sent to your
              WhatsApp
            </CardDescription>
          </div>
          <div className="w-3/4 my-3 border-muted/50 h-0.5 border-dashed border mb-4" />
        </CardHeader>

        <form onSubmit={handleSubmit} className="space-y-2">
          <CardContent className="space-y-4 px-6!">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="installerCode">
                Installer Code <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="installerCode"
                  value={installerCode}
                  onChange={(e) =>
                    setInstallerCode(e.target.value.toUpperCase())
                  }
                  placeholder="e.g. INS-0001"
                  autoComplete="username"
                  className="pl-10 uppercase"
                />
                <IconUserOctagon className="absolute -translate-y-1/2 top-1/2 left-3 size-4.5" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">
                PIN <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="6-digit PIN"
                  autoComplete="current-password"
                  className={cn("pl-10 tracking-widest")}
                />
                <IconLockPassword className="absolute -translate-y-1/2 top-1/2 left-3 size-4.5" />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !installerCode || pin.length !== 6}
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
            <p className="text-xs text-muted-foreground text-center text-balance">
              Forgot your PIN? Contact your Fronus team to reset it.
            </p>
            <Button variant="link" className="p-0 h-max text-xs" asChild>
              <Link href="/auth/signin">Team member? Sign in here</Link>
            </Button>
          </CardFooter>
        </form>

        <div className="py-4 pb-4 text-xs text-center text-muted-foreground">
          Fronus &copy; {new Date().getFullYear()}
          <span className="text-muted">•</span> All rights reserved
        </div>
      </Card>
    </div>
  );
}
