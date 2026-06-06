/** Lightweight shimmering placeholder block. */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-sand-dark/70 ${className}`}
      aria-hidden
    />
  );
}

/**
 * Generic page skeleton shown while a route loads: a title line, a row of
 * stat blocks, and a few large card placeholders — matching the app's
 * card-based layout.
 */
export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Chargement…">
      <Skeleton className="h-8 w-1/2" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>

      <div className="space-y-3">
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
        <Skeleton className="h-24 rounded-3xl" />
      </div>

      <span className="sr-only">Chargement en cours…</span>
    </div>
  );
}
