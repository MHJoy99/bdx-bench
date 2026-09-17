"use client";

/** TrendSections — route-support blocks for /trends (NOT a page).
 *  Single-snapshot honesty: one measured point per model, no invented
 *  history. Tables stay the source of truth until a second snapshot lands.
 */

import React, { useMemo } from "react";
import { ChartShell } from "../charts/ChartShell";
import { TrendChart, trendsToTable } from "../charts/TrendChart";
import type { ThemeMode, TrendRange, TrendSeries } from "../charts/types";
import {
  REAL_EVAL_DATE,
  REAL_PROVENANCE_NOTE,
  REAL_TRENDS,
} from "../charts/real-data";

export interface TrendSectionsProps {
  capability?: TrendSeries[];
  cost?: TrendSeries[];
  context?: TrendSeries[];
  speed?: TrendSeries[];
  open?: TrendSeries[];
  closed?: TrendSeries[];
  range?: TrendRange;
  onRangeChange?: (r: TrendRange) => void;
  loading?: boolean;
  error?: string | null;
  mode?: ThemeMode;
  onRetry?: () => void;
}

function singleSnapshotNote(): string {
  return (
    `Single measured snapshot (${REAL_EVAL_DATE}). ` +
    "A trend needs at least two snapshots; until then the point below plus the data table are the full story. " +
    `${REAL_PROVENANCE_NOTE}.`
  );
}

export function TrendSections({
  capability = REAL_TRENDS,
  cost = [],
  context = [],
  speed = [],
  open = [],
  closed = [],
  range,
  onRangeChange,
  loading = false,
  error = null,
  mode,
  onRetry,
}: TrendSectionsProps) {
  const openVsClosed = useMemo(() => [...open, ...closed], [open, closed]);

  const blocks: Array<{
    id: string;
    title: string;
    sub: string;
    data: TrendSeries[];
    tableId: string;
  }> = [
    {
      id: "capability",
      title: "Capability over time",
      sub: "Showdown score per model. Single snapshot so far.",
      data: capability,
      tableId: "trends-table-capability",
    },
    {
      id: "cost",
      title: "Cost over time",
      sub: "Blended USD per 1M tokens. No cost measurements yet.",
      data: cost,
      tableId: "trends-table-cost",
    },
    {
      id: "context",
      title: "Context window over time",
      sub: "Max input tokens advertised per model. No measurements yet.",
      data: context,
      tableId: "trends-table-context",
    },
    {
      id: "speed",
      title: "Speed over time",
      sub: "Median output tokens/sec across runs. No measurements yet.",
      data: speed,
      tableId: "trends-table-speed",
    },
    {
      id: "open-closed",
      title: "Open vs closed",
      sub: "Mean score: open-weights average against closed average. No grouping measured yet.",
      data: openVsClosed,
      tableId: "trends-table-open-closed",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {blocks.map((b) => {
        const empty = !b.data.length || !b.data.some((s) => s.points.length);
        return (
          <ChartShell
            key={b.id}
            title={b.title}
            subtitle={b.sub}
            height={300}
            loading={loading}
            error={error}
            isEmpty={empty}
            emptyMessage="Not enough measured data yet. See the data table below."
            table={trendsToTable(b.data, b.title)}
            tableId={b.tableId}
            onRetry={onRetry}
            footer={b.id === "capability" && !empty ? <span>{singleSnapshotNote()}</span> : undefined}
          >
            <TrendChart
              series={b.data}
              range={range}
              onRangeChange={onRangeChange}
              height={300}
              mode={mode}
              ariaLabel={`${b.title} trend chart`}
            />
            {b.id === "capability" && !empty ? (
              <p className="bdx-chart-foot">{singleSnapshotNote()}</p>
            ) : null}
          </ChartShell>
        );
      })}
    </div>
  );
}
