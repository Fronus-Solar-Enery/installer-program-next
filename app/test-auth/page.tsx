"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TestAuthPage() {
  const [sessionTest, setSessionTest] = useState<any>(null);
  const [debugTest, setDebugTest] = useState<any>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    // Test session endpoint
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => setSessionTest(data))
      .catch((err) => setSessionError(err.message));

    // Test debug endpoint
    fetch("/api/debug-auth")
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then((data) => setDebugTest(data))
      .catch((err) => setDebugError(err.message));
  }, []);

  return (
    <div className="container mx-auto p-8 space-y-4">
      <h1 className="text-3xl font-bold mb-6">Auth System Test</h1>

      <Card>
        <CardHeader>
          <CardTitle>Session Endpoint Test</CardTitle>
        </CardHeader>
        <CardContent>
          {sessionError ? (
            <div className="text-red-600">
              <strong>Error:</strong> {sessionError}
            </div>
          ) : (
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(sessionTest, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Endpoint Test</CardTitle>
        </CardHeader>
        <CardContent>
          {debugError ? (
            <div className="text-red-600">
              <strong>Error:</strong> {debugError}
            </div>
          ) : (
            <pre className="bg-muted p-4 rounded text-xs overflow-auto">
              {JSON.stringify(debugTest, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button asChild>
          <Link href="/auth/signin">Go to Sign In</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/auth/error?error=Configuration">Test Error Page</Link>
        </Button>
      </div>
    </div>
  );
}
