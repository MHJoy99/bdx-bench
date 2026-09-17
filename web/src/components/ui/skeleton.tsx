import * as React from "react";
import { cn } from "@/lib/utils";

/** Shimmer placeholder. Pair with Empty/Loading states in state.tsx. */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      role="presentation"
      className={cn("skeleton-shimmer animate-pulse rounded-[6px]", className)}
      {...props}
    />
  );
}

/** 3-row leaderboard-shaped placeholder for tables. */
function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-hidden role="presentation">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-full" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

export { Skeleton, TableSkeleton };
