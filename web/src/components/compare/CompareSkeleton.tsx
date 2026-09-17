/**
 * SUB-AGENT 6/10 COMPARE — owned: skeleton loaders for /compare.
 * Server-safe (no hooks): used as the Suspense fallback in page.tsx and for
 * in-flight refetches in CompareView.
 */
export function CompareSkeleton() {
  return (
    <div role="status" aria-label="Loading comparison" aria-busy="true" className="space-y-4">
      <div className="h-6 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-card" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-lg border border-border bg-card" aria-hidden="true" />
      <div className="grid gap-4 lg:grid-cols-2" aria-hidden="true">
        <div className="h-56 animate-pulse rounded-lg border border-border bg-card" />
        <div className="h-56 animate-pulse rounded-lg border border-border bg-card" />
      </div>
      <span className="sr-only">Loading comparison…</span>
    </div>
  );
}
