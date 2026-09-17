"use client";

/** ScatterSection — route-support block for /price-performance (NOT a page).
 *  Pages own routing/fetch/URL state; this owns chart wiring + Pareto explainer.
 */

import React, { useMemo, useState } from "react";
import { ChartShell } from "../charts/ChartShell";
import { PARETO_EXPLANATION, ScatterPlot, scatterToTable, type ScatterSizeBy } from "../charts/ScatterPlot";
import type { ThemeMode } from "../charts/types";
import { DEMO_SCATTER_POINTS } from "../charts/demo";

export interface ScatterSectionProps {
  points?: import("../charts/types").ScatterPoint[];
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
  points = DEMO_SCATTER_POINTS,
  loading = false,
  error = null,
  showPareto = true,
  explanation = PARETO_EXPLANATION,
  sizeBy: sizeByProp = "speed",
  mode,
  onSelect,
  onRetry,
}: ScatterSectionProps) {
  const [sizeBy, setSizeBy] = useState<ScatterSizeBy>(sizeByProp);
  const table = useMemo(() => scatterToTable(points), [points]);

  return (
    <ChartShell
      title="Price vs performance"
      subtitle="Blended cost per 1M tokens (log X) against intelligence score (Y). Bubble = speed or context."
      height={400}
      loading={loading}
      error={error}
      isEmpty={!points.length}
      emptyMessage="No price/performance rows for this filter."
      table={table}
      onRetry={onRetry}
      actions={
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
      }
      footer={
        <details>
          <summary>
            <strong>What is the Pareto frontier?</strong>
          </summary>
          <p style={{ margin: "6px 0 0" }}>{explanation}</p>
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
