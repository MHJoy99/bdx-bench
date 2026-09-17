import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Geometric state illustrations (SUB-AGENT 10/10 POLISH).
 * Minimal line-geometry SVG — no cartoon, no gradients, no glow. Stroke-only
 * marks in border tones with a single accent/danger accent element, so they
 * read in both themes without extra variants.
 *
 * Complements ui/state.tsx (Lucide-icon states, design-system agent owns that
 * file): use these marks where a larger visual anchor helps (full-page empty
 * results, failed chart loads). Same shell metrics (dashed 10px card).
 */

export function EmptyMark({ className }: { className?: string }) {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      className={className}
    >
      <rect
        x="6.5"
        y="6.5"
        width="43"
        height="43"
        rx="8"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
      />
      <line x1="14" y1="42" x2="42" y2="42" stroke="var(--border-strong)" strokeWidth="1.5" />
      <rect x="18" y="30" width="5" height="12" rx="1" stroke="var(--border-strong)" strokeWidth="1.5" />
      <rect x="25.5" y="24" width="5" height="18" rx="1" stroke="var(--border-strong)" strokeWidth="1.5" />
      <rect x="33" y="17" width="5" height="25" rx="1" stroke="var(--accent)" strokeWidth="1.5" />
    </svg>
  );
}

export function ErrorMark({ className }: { className?: string }) {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      className={className}
    >
      <path
        d="M28 8 L48 44 H8 Z"
        stroke="var(--border-strong)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="28" y1="22" x2="28" y2="32" stroke="var(--danger)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="37" r="1.4" fill="var(--danger)" />
    </svg>
  );
}

function GeometricShell({
  mark,
  title,
  hint,
  action,
  className,
}: {
  mark: React.ReactNode;
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-[10px] border border-dashed border-[var(--border-strong)] bg-[var(--surface)] px-6 py-10 text-center",
        className,
      )}
    >
      {mark}
      <p className="pt-1 text-sm font-semibold text-[var(--text)]">{title}</p>
      {hint && (
        <p className="max-w-sm text-[13px] leading-5 text-[var(--text-secondary)]">{hint}</p>
      )}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function GeometricEmptyState({
  title = "No results yet",
  hint = "Run the suite or adjust filters to populate this view.",
  action,
  className,
}: {
  title?: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <GeometricShell mark={<EmptyMark />} title={title} hint={hint} action={action} className={className} />
  );
}

export function GeometricErrorState({
  title = "Couldn't load data",
  hint = "Check the API server on :8765 and retry.",
  onRetry,
  action,
  className,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <GeometricShell
      mark={<ErrorMark />}
      title={title}
      hint={hint}
      className={className}
      action={
        action ??
        (onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined)
      }
    />
  );
}
