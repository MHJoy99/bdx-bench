"use client";

/** TrendSections — route-support blocks for /trends (NOT a page).
 *  Five capability/cost/context/speed/open-vs-closed sections; pages wire data.
 */

import React, { useMemo } from "react";
import { ChartShell } from "../charts/ChartShell";
import { TrendChart, trendsToTable, type TrendMetric } from "../charts/TrendChart";
import type { ThemeMode, TrendRange, TrendSeries } from "../charts/types";
import {
  DEMO_TRENDS_CAPABILITY,
  DEMO_TRENDS_CLOSED,
  DEMO_TRENDS_CONTEXT,
  DEMO_TRENDS_COST,
  DEMO_TRENDS_OPEN,
  DEMO_TRENDS_SPEED,
} from "../charts/demo";

export const TREND_METRICS: TrendMetric[] = [
  { id: "capability", label: "Capability (avg score)" },
  { id: "cost", label: "Blended cost $/1M" },
  { id: "context", label: "Context window (K)" },
  { id: "speed", label: "Speed (tok/s)" },
];

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

export function TrendSections({
  capability = DEMO_TRENDS_CAPABILITY,
  cost = DEMO_TRENDS_COST,
  context = DEMO_TRENDS_CONTEXT,
  speed = DEMO_TRENDS_SPEED,
  open = DEMO_TRENDS_OPEN,
  closed = DEMO_TRENDS_CLOSED,
  range,
  onRangeChange,
  loading = false,
  error = null,
  mode,
  onRetry,
}: TrendSectionsProps) {
  const openVsClosed = useMemo(() => [...open, ...closed], [open, closed]);

  const blocks: Array<{ id: string; title: string; sub: string; data: TrendSeries[] }> = [
    { id: "capability", title: "Capability over time", sub: "Average benchmark score per model.", data: capability },
    { id: "cost", title: "Cost over time", sub: "Blended USD per 1M tokens. Falling = cheaper.", data: cost },
    { id: "context", title: "Context window over time", sub: "Max input tokens (K) advertised per model.", data: context },
    { id: "speed", title: "Speed over time", sub: "Median output tokens/sec across runs.", data: speed },
    { id: "open-closed", title: "Open vs closed", sub: "Mean score: open-weights average against closed average.", data: openVsClosed },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {blocks.map((b) => (
        <ChartShell
          key={b.id}
          title={b.title}
          subtitle={b.sub}
          height={300}
          loading={loading}
          error={error}
          isEmpty={!b.data.length || !b.data.some((s) => s.points.length)}
          emptyMessage={`No ${b.id} history in range.`}
          table={trendsToTable(b.data, b.title)}
          onRetry={onRetry}
        >
          <TrendChart
            series={b.data}
            range={range}
            onRangeChange={onRangeChange}
            height={300}
            mode={mode}
            ariaLabel={`${b.title} trend chart`}
          />
        </ChartShell>
      ))}
    </div>
  );
}
