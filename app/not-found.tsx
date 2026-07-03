import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Root 404 page. Rendered for unmatched routes and any notFound() call.
 */
export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <p className="font-mono text-6xl font-semibold text-primary">404</p>
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-foreground">
            Page not found
          </h2>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
