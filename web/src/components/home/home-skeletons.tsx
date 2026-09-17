import { Skeleton } from "@/components/ui/skeleton";

export function HomeTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading rankings"
      className="overflow-hidden rounded-[10px] border border-bdx-border bg-bdx-surface"
    >
      <div className="grid grid-cols-[3rem_1fr_5rem] gap-3 border-b border-bdx-border px-4 py-3 sm:grid-cols-[3rem_1.4fr_1fr_5rem_5rem_5rem_5rem]">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="grid grid-cols-[3rem_1fr_5rem] items-center gap-3 border-b border-bdx-border/60 px-4 py-3 last:border-0 sm:grid-cols-[3rem_1.4fr_1fr_5rem_5rem_5rem_5rem]"
        >
          {Array.from({ length: 7 }).map((_, c) => (
            <Skeleton key={c} className="h-4 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function HomeCardsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading stats"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-[10px] border border-bdx-border bg-bdx-surface p-4">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="mt-3 h-7 w-1/2" />
          <Skeleton className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function HomeEmptyState({
  title,
  hint,
}: {
  title: string;
  hint: string;
}) {
  return (
    <div
      role="status"
      className="rounded-[10px] border border-dashed border-bdx-border bg-bdx-surface px-6 py-10 text-center"
    >
      <p className="text-sm font-semibold text-bdx-ink">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-bdx-muted">{hint}</p>
    </div>
  );
}
