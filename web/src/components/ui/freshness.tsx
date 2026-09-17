import * as React from "react";
import { cn } from "@/lib/utils";

type Freshness = "fresh" | "stale" | "live" | "mock";

const DOT: Record<Freshness, string> = {
  fresh: "bg-[var(--success)]",
  live: "bg-[var(--success)]",
  stale: "bg-[var(--warning)]",
  mock: "bg-[var(--warning)]",
};

function formatAge(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Freshness indicator: colored dot + label + relative age.
 * - live/fresh → lime dot · stale/mock → amber dot.
 * - `updatedAt` ISO renders "Xm ago"; pass `label` override for static text.
 */
function FreshnessIndicator({
  status = "fresh",
  updatedAt,
  label,
  className,
}: {
  status?: Freshness;
  updatedAt?: string | number | Date;
  label?: string;
  className?: string;
}) {
  const age = React.useMemo(() => {
    if (!updatedAt) return null;
    const t = new Date(updatedAt).getTime();
    if (Number.isNaN(t)) return null;
    return formatAge(Date.now() - t);
  }, [updatedAt]);

  const text = label ?? (age ? `Updated ${age}` : status === "mock" ? "Mock data" : status);
  const pulse = status === "live";

  return (
    <span
      role="status"
      title={updatedAt ? `Last updated: ${new Date(updatedAt).toISOString()}` : text}
      className={cn(
        "inline-flex items-center gap-1.5 text-[12px] leading-4 text-[var(--text-secondary)]",
        className,
      )}
    >
      <span className="relative flex size-2">
        {pulse && (
          <span
            aria-hidden
            className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-40", DOT[status])}
          />
        )}
        <span aria-hidden className={cn("relative inline-flex size-2 rounded-full", DOT[status])} />
      </span>
      <span className="tnum">{text}</span>
    </span>
  );
}

export { FreshnessIndicator, type Freshness };
