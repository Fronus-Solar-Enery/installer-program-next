"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Home, Copy } from "lucide-react";
import { toast } from "sonner";

interface DebugInfo {
  timestamp: string;
  environment: string;
  envVars: {
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    MONGODB_URI: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
  };
  authModuleError: string | null;
}

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Server Configuration Error",
    description:
      "There is a problem with the server configuration. This usually means environment variables are not set correctly in the deployment.",
  },
  AccessDenied: {
    title: "Access Denied",
    description: "You do not have permission to sign in.",
  },
  Verification: {
    title: "Verification Error",
    description: "The verification token has expired or has already been used.",
  },
  Default: {
    title: "Authentication Error",
    description:
      "An error occurred during authentication. Please try again later.",
  },
};

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("Default");
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }

    // Fetch debug information
    fetch("/api/debug-auth")
      .then((res) => res.json())
      .then((data) => {
        setDebugInfo(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch debug info:", err);
        setLoading(false);
      });
  }, [searchParams]);

  const errorInfo = errorMessages[error] || errorMessages.Default;

  const copyDebugInfo = () => {
    const info = JSON.stringify(debugInfo, null, 2);
    navigator.clipboard.writeText(info);
    toast.success("Debug info copied to clipboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {errorInfo.title}
          </CardTitle>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error Code: {error}</AlertTitle>
            <AlertDescription>
              If this problem persists, please contact support with the error
              code and debug information below.
            </AlertDescription>
          </Alert>

          {/* Debug Information */}
          {loading ? (
            <div className="text-center text-muted-foreground py-4">
              Loading diagnostic information...
            </div>
          ) : debugInfo ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Debug Information</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyDebugInfo}
                  className="h-8"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copy
                </Button>
              </div>

              <div className="bg-muted rounded-md p-4 space-y-2 text-sm font-mono">
                <div>
                  <span className="text-muted-foreground">Environment:</span>{" "}
                  <span className="font-semibold">{debugInfo.environment || "unknown"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Timestamp:</span>{" "}
                  <span>{debugInfo.timestamp}</span>
                </div>

                <div className="pt-2 border-t border-border">
                  <div className="text-muted-foreground mb-2">Environment Variables:</div>
                  {debugInfo.envVars && Object.entries(debugInfo.envVars).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2 py-1">
                      <span className={value === "NOT SET" ? "text-destructive" : "text-green-600"}>
                        {value === "NOT SET" ? "✗" : "✓"}
                      </span>
                      <span className="text-muted-foreground">{key}:</span>
                      <span className={value === "NOT SET" ? "text-destructive font-semibold" : ""}>
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>

                {debugInfo.authModuleError && (
                  <div className="pt-2 border-t border-destructive">
                    <div className="text-destructive font-semibold mb-2">Auth Module Error:</div>
                    <div className="text-destructive whitespace-pre-wrap break-all">
                      {debugInfo.authModuleError}
                    </div>
                  </div>
                )}
              </div>

              {/* Troubleshooting hints */}
              {debugInfo.envVars && Object.entries(debugInfo.envVars).some(([_, value]) => value === "NOT SET") && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Missing Environment Variables</AlertTitle>
                  <AlertDescription>
                    Some required environment variables are not set. Please check your deployment settings
                    and ensure all variables are configured for the production environment.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load diagnostic information. Check browser console for details.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2 pt-4">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                <Home className="w-4 h-4 mr-2" />
                Go to Homepage
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
