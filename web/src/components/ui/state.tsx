import * as React from "react";
import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TableSkeleton } from "@/components/ui/skeleton";

function StateShell({
  icon,
  title,
  hint,
  action,
  className,
}: {
  icon: React.ReactNode;
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
      <span className="flex size-9 items-center justify-center rounded-md bg-[var(--elevated)] text-[var(--text-secondary)]">
        {icon}
      </span>
      <p className="text-sm font-semibold">{title}</p>
      {hint && <p className="max-w-sm text-[13px] text-[var(--text-secondary)]">{hint}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

function EmptyState({
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
    <StateShell
      icon={<Inbox className="size-4" aria-hidden />}
      title={title}
      hint={hint}
      action={action}
      className={className}
    />
  );
}

function ErrorState({
  title = "Couldn't load data",
  hint = "Check the API server on :8765 and retry.",
  onRetry,
  className,
}: {
  title?: string;
  hint?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <StateShell
      icon={<AlertTriangle className="size-4 text-[var(--danger)]" aria-hidden />}
      title={title}
      hint={hint}
      className={className}
      action={
        onRetry ? (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Retry
          </Button>
        ) : undefined
      }
    />
  );
}

function LoadingState({
  label = "Loading…",
  rows = 5,
  className,
}: {
  label?: string;
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)} role="status" aria-live="polite" aria-label={label}>
      <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        <span className="tnum">{label}</span>
      </span>
      <TableSkeleton rows={rows} />
    </div>
  );
}

export { EmptyState, ErrorState, LoadingState };
