import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Extended skeleton set (SUB-AGENT 10/10 POLISH). Builds on the base
 * `Skeleton`/`TableSkeleton` in ui/skeleton.tsx (design-system agent owns
 * that file — this file only ADDS row/card/chart variants, no overlap).
 *
 * All variants are static layout + the shared `.skeleton-shimmer` class;
 * shimmer is disabled globally under prefers-reduced-motion (app/globals.css).
 */

function SkeletonStatus({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-label={label} className={cn("flex flex-col gap-2", className)}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Generic data-table shape: header bar row + body rows. */
export function DataTableSkeleton({
  rows = 6,
  cols = 4,
  label = "Loading table…",
  className,
}: {
  rows?: number;
  cols?: number;
  label?: string;
  className?: string;
}) {
  const safeCols = Math.min(Math.max(cols, 1), 8);
  return (
    <SkeletonStatus label={label} className={className}>
      <div
        aria-hidden
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: safeCols }).map((_, c) => (
          <Skeleton key={`h-${c}`} className="h-3.5 w-2/3 opacity-70" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`r-${r}`}
          aria-hidden
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${safeCols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: safeCols }).map((_, c) => (
            <Skeleton
              key={`r-${r}-c-${c}`}
              className={cn("h-8 w-full", c === 0 && "w-11/12")}
              style={{ opacity: 1 - r * 0.09 }}
            />
          ))}
        </div>
      ))}
    </SkeletonStatus>
  );
}

/** Leaderboard row shape: rank square + name + score + price. */
export function LeaderboardRowSkeleton({
  rows = 8,
  label = "Loading leaderboard…",
  className,
}: {
  rows?: number;
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonStatus label={label} className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} aria-hidden className="flex items-center gap-3">
          <Skeleton className="size-8 shrink-0" style={{ opacity: 1 - i * 0.07 }} />
          <Skeleton className="h-8 min-w-0 flex-1" style={{ opacity: 1 - i * 0.07 }} />
          <Skeleton className="hidden h-8 w-16 shrink-0 sm:block" style={{ opacity: 1 - i * 0.07 }} />
          <Skeleton className="hidden h-8 w-20 shrink-0 md:block" style={{ opacity: 1 - i * 0.07 }} />
        </div>
      ))}
    </SkeletonStatus>
  );
}

/** Model-card grid shape for /compare and model index surfaces. */
export function ModelCardSkeleton({
  count = 6,
  label = "Loading models…",
  className,
}: {
  count?: number;
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonStatus
      label={label}
      className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          aria-hidden
          className="flex flex-col gap-2.5 rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 shrink-0" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-7 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </SkeletonStatus>
  );
}

/**
 * Bar-chart placeholder. Heights are deterministic (modular arithmetic —
 * SSR-stable, no Math.random hydration mismatch).
 */
export function ChartSkeleton({
  bars = 12,
  label = "Loading chart…",
  className,
}: {
  bars?: number;
  label?: string;
  className?: string;
}) {
  return (
    <SkeletonStatus label={label} className={className}>
      <div aria-hidden className="flex h-40 items-end gap-1.5">
        {Array.from({ length: bars }).map((_, i) => {
          const h = 28 + ((i * 53) % 66);
          return (
            <Skeleton
              key={i}
              className="min-w-0 flex-1 rounded-[4px]"
              style={{ height: `${h}%`, opacity: 0.55 + (i % 3) * 0.15 }}
            />
          );
        })}
      </div>
      <Skeleton aria-hidden className="h-3 w-full opacity-60" />
    </SkeletonStatus>
  );
}
