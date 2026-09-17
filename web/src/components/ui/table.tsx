import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Dense leaderboard table bits. Wrap in .card-flat or Card.
 * Numeric cells ALWAYS use .tnum (tabular-nums) so ranks/scores align.
 */
function Table({ className, ...props }: React.TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
      <table
        className={cn("w-full min-w-[560px] border-collapse text-[13px] leading-5", className)}
        {...props}
      />
    </div>
  );
}

function TableHead({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-[var(--border)]", className)} {...props} />;
}

function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--border)] transition-colors hover:bg-[var(--elevated)]",
        className,
      )}
      {...props}
    />
  );
}

function TableHeaderCell({
  className,
  numeric,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]",
        numeric && "tnum text-right",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({
  className,
  numeric,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  return (
    <td className={cn("px-3 py-2 align-middle", numeric && "tnum text-right", className)} {...props} />
  );
}

/** Right-aligned numeric cell with tabular figures — use for avgScore/passRate/ms. */
function NumericCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <TableCell numeric className={cn("font-mono text-[12.5px]", className)} {...props} />;
}

export { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell, NumericCell };
