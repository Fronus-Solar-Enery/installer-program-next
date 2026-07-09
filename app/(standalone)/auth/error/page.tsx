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
import { AlertCircle, Home, Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface DebugInfo {
  timestamp: string;
  environment: string;
  envVars: {
    NEXTAUTH_URL: string;
    NEXTAUTH_SECRET: string;
    MONGODB_URI: string;
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
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchDebugInfo = async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const response = await fetch("/api/debug-auth");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Debug info received:", data);
      setDebugInfo(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error";
      console.error("Failed to fetch debug info:", err);
      setFetchError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
    }

    fetchDebugInfo();
  }, [searchParams]);

  const errorInfo = errorMessages[error] || errorMessages.Default;

  const copyDebugInfo = () => {
    const info = JSON.stringify(
      {
        errorCode: error,
        debugInfo,
        fetchError,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    navigator.clipboard.writeText(info);
    toast.success("Debug info copied to clipboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted px-4 py-8">
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
              Review the debug information below to identify the issue.
            </AlertDescription>
          </Alert>

          {/* Debug Information Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Diagnostic Information</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchDebugInfo}
                  disabled={loading}
                  className="h-8"
                >
                  <RefreshCw
                    className={`w-3 h-3 mr-1 ${loading ? "animate-spin" : ""}`}
                  />
                  Reload
                </Button>
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
            </div>

            {loading ? (
              <div className="bg-muted rounded-md p-8 text-center">
                <div className="animate-spin inline-block w-6 h-6 border-2 border-current border-t-transparent rounded-full mb-2" />
                <p className="text-sm text-muted-foreground">
                  Loading diagnostic data...
                </p>
              </div>
            ) : fetchError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed to Load Debug Info</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2">
                    <p>Error: {fetchError}</p>
                    <p className="text-xs">
                      This might indicate a server configuration issue.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            ) : debugInfo ? (
              <div className="space-y-3">
                <div className="bg-muted rounded-md p-4 space-y-3 text-sm font-mono">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">
                        Environment:
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold">
                        {debugInfo.environment || "unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Timestamp:</span>
                    </div>
                    <div>
                      <span className="text-xs">
                        {new Date(debugInfo.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border">
                    <div className="font-semibold mb-3 text-foreground">
                      Environment Variables Status:
                    </div>
                    <div className="space-y-2">
                      {debugInfo.envVars &&
                        Object.entries(debugInfo.envVars).map(
                          ([key, value]) => {
                            const isSet = value !== "NOT SET";
                            return (
                              <div
                                key={key}
                                className="flex items-start gap-3 p-2 rounded bg-background"
                              >
                                <div className="shrink-0 mt-0.5">
                                  {isSet ? (
                                    <span className="text-green-600 font-bold text-lg">
                                      ✓
                                    </span>
                                  ) : (
                                    <span className="text-destructive font-bold text-lg">
                                      ✗
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-foreground">
                                    {key}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      isSet
                                        ? "text-muted-foreground"
                                        : "text-destructive font-semibold"
                                    }`}
                                  >
                                    {String(value)}
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                    </div>
                  </div>

                  {debugInfo.authModuleError && (
                    <div className="pt-3 border-t border-destructive">
                      <div className="text-destructive-text font-semibold mb-2">
                        Auth Module Error:
                      </div>
                      <div className="bg-destructive/10 p-3 rounded text-destructive text-xs whitespace-pre-wrap break-all">
                        {debugInfo.authModuleError}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actionable recommendations */}
                {debugInfo.envVars &&
                  Object.entries(debugInfo.envVars).some(
                    ([_, value]) => value === "NOT SET"
                  ) && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Action Required</AlertTitle>
                      <AlertDescription>
                        <div className="space-y-2">
                          <p>
                            Missing environment variables detected. To fix this:
                          </p>
                          <ol className="list-decimal list-inside space-y-1 text-xs ml-2">
                            <li>Go to your Vercel dashboard</li>
                            <li>Select this project</li>
                            <li>
                              Navigate to Settings → Environment Variables
                            </li>
                            <li>
                              Add the missing variables for Production
                              environment
                            </li>
                            <li>Redeploy the application</li>
                          </ol>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No diagnostic data available. Try reloading or check browser
                  console.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t">
            <Button asChild className="w-full">
              <Link href="/auth/signin">Try Signing In Again</Link>
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
