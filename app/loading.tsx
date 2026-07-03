import { Skeleton } from "@/components/ui/skeleton";

/**
 * Route-level loading fallback. Next.js shows this during segment navigation /
 * client-chunk load for any route without its own loading.tsx. Client pages
 * still render their own data-fetch skeletons (TanStack Query isFetching) once
 * mounted — this only covers the transition before the page component renders.
 * A single file at app/ root covers the whole tree; add a nested loading.tsx
 * only where a route needs a tailored shell.
 */
export default function Loading() {
  return (
    <div className="flex-1 space-y-4 overflow-hidden p-6" aria-busy="true">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="hidden h-12 w-12 md:block" round />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>

      {/* Content block */}
      <div className="space-y-3 rounded-2xl border border-border p-4">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
