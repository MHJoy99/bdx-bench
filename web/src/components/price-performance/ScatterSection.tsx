"use client";

/** ScatterSection — route-support block for /price-performance (NOT a page).
 *  Renders measured price/performance only; with no measured prices it
 *  stays an honest table plus a Pareto explainer.
 */

import React, { useMemo } from "react";
import { ChartShell } from "../charts/ChartShell";
import { NotEnoughData } from "../charts/NotEnoughData";
import {
  PARETO_EXPLANATION,
  PARETO_SINGLE_BENCHMARK_NOTE,
  ScatterPlot,
  scatterToTable,
  type ScatterSizeBy,
} from "../charts/ScatterPlot";
import type { ScatterPoint, ThemeMode } from "../charts/types";

export interface ScatterSectionProps {
  points?: ScatterPoint[];
  loading?: boolean;
  error?: string | null;
  showPareto?: boolean;
  /** Override the default Pareto explainer copy. */
  explanation?: string;
  sizeBy?: ScatterSizeBy;
  mode?: ThemeMode;
  onSelect?: (model: string) => void;
  onRetry?: () => void;
}

export function ScatterSection({
  points = [],
  loading = false,
  error = null,
  showPareto = true,
  explanation = PARETO_EXPLANATION,
  sizeBy: sizeByProp = "speed",
  mode,
  onSelect,
  onRetry,
}: ScatterSectionProps) {
  const [sizeBy, setSizeBy] = React.useState<ScatterSizeBy>(sizeByProp);
  const table = useMemo(() => scatterToTable(points), [points]);
  const hasPrice = points.some(
    (p) => Number.isFinite(p.blendedCost) && p.blendedCost > 0,
  );
  const isEmpty = !points.length || !hasPrice;

  return (
    <ChartShell
      title="Price vs performance"
      subtitle="Blended cost per 1M tokens (log X) against showdown score (Y). No prices measured yet."
      height={400}
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyMessage={
        <NotEnoughData tableId="price-table-scatter" what="price for a price-vs-performance plot" />
      }
      table={table}
      tableId="price-table-scatter"
      onRetry={onRetry}
      actions={
        !isEmpty ? (
          <div className="bdx-chip-row" role="group" aria-label="Bubble size">
            {(["speed", "context", "runs", "none"] as ScatterSizeBy[]).map((s) => (
              <button
                key={s}
                type="button"
                className="bdx-chip"
                aria-pressed={sizeBy === s}
                onClick={() => setSizeBy(s)}
              >
                {s === "none" ? "fixed size" : s}
              </button>
            ))}
          </div>
        ) : undefined
      }
      footer={
        <details>
          <summary>
            <strong>What is the Pareto frontier?</strong>
          </summary>
          <p style={{ margin: "6px 0 0" }}>{explanation}</p>
          <p style={{ margin: "6px 0 0" }}>{PARETO_SINGLE_BENCHMARK_NOTE}</p>
        </details>
      }
    >
      <ScatterPlot
        points={points}
        showPareto={showPareto}
        sizeBy={sizeBy}
        height={400}
        mode={mode}
        onPointClick={onSelect}
      />
    </ChartShell>
  );
}
