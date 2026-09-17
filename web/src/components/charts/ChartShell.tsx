"use client";

/** ChartShell — theme-aware frame for every viz.
 *
 *  Owns: title/subtitle header, skeleton (loading), empty + error states,
 *  responsive min-height, and the a11y textual fallback (a visible
 *  <details> data table PLUS a screen-reader table). Charts inside stay pure.
 */

import React from "react";
import type { AriaTable } from "./types";
import "./charts.css";

export interface ChartShellProps {
  title: string;
  subtitle?: string;
  /** Chart height in px (width is always 100% + ResizeObserver). */
  height?: number;
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;
  emptyMessage?: React.ReactNode;
  /** Accessible name for the figure. Defaults to title. */
  ariaLabel?: string;
  /** Tabular equivalent of the visual — required for a11y compliance. */
  table?: AriaTable;
  /** Anchor id for the data-table details so empty states can link to it. */
  tableId?: string;
  actions?: React.ReactNode;
  footer?: React.ReactNode;
  onRetry?: () => void;
  testId?: string;
  children: React.ReactNode;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function ChartShell({
  title,
  subtitle,
  height = 320,
  loading = false,
  error = null,
  isEmpty = false,
  emptyMessage = "Not enough measured data yet. See the data table below.",
  ariaLabel,
  table,
  tableId: tableIdProp,
  actions,
  footer,
  onRetry,
  testId,
  children,
}: ChartShellProps) {
  const label = ariaLabel ?? title;
  const tableId = tableIdProp ?? `bdx-table-${slugify(title)}`;
  return (
    <section
      className="bdx-chart-shell"
      aria-label={label}
      data-testid={testId ?? `chart-${title}`}
    >
      <header className="bdx-chart-head">
        <div>
          <h3 className="bdx-chart-title">{title}</h3>
          {subtitle ? <p className="bdx-chart-sub">{subtitle}</p> : null}
        </div>
        {actions ? <div className="bdx-chart-actions">{actions}</div> : null}
      </header>

      <div className="bdx-chart-body" style={{ minHeight: height }}>
        {loading ? (
          <div
            className="bdx-skeleton"
            style={{ height }}
            role="status"
            aria-label={`Loading ${title}`}
          >
            <span className="bdx-skeleton-bar" style={{ width: "42%" }} />
            <span className="bdx-skeleton-bar" style={{ width: "78%" }} />
            <span className="bdx-skeleton-bar" style={{ width: "64%" }} />
            <span className="sr-only">Loading {title}…</span>
          </div>
        ) : error ? (
          <div className="bdx-state bdx-state-error" role="alert">
            <p>
              <strong>Couldn’t load {title}.</strong> {error}
            </p>
            {onRetry ? (
              <button type="button" className="bdx-btn" onClick={onRetry}>
                Retry
              </button>
            ) : null}
          </div>
        ) : isEmpty ? (
          <div className="bdx-state" role="status">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          <figure className="bdx-figure" role="img" aria-label={label}>
            {children}
          </figure>
        )}
      </div>

      {table && !loading && !error ? (
        <details className="bdx-fallback" id={tableId}>
          <summary>View data as table ({table.rows.length} rows)</summary>
          <div className="bdx-table-wrap" tabIndex={0}>
            <table>
              <caption className="sr-only">{table.caption}</caption>
              <thead>
                <tr>
                  {table.columns.map((c) => (
                    <th key={c} scope="col">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, j) => (
                      <td key={j}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ) : null}

      {footer ? <footer className="bdx-chart-foot">{footer}</footer> : null}
    </section>
  );
}
