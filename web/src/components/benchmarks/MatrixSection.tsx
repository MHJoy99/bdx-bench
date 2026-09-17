"use client";

/** MatrixSection — route-support block for /benchmarks (NOT a page).
 *  Honest 1-benchmark x 2-model reality: one showdown column, two measured
 *  cells (92 / 88). Hover shows raw + normalized + date + runs.
 */

import React, { useMemo } from "react";
import { ChartShell } from "../charts/ChartShell";
import { HeatmapMatrix, heatmapToTable, type HeatSortBy, type HeatSortDir } from "../charts/HeatmapMatrix";
import type { HeatmapCell, ThemeMode } from "../charts/types";
import {
  REAL_HEATMAP_BENCHMARKS,
  REAL_HEATMAP_CELLS,
  REAL_HEATMAP_MODELS,
  REAL_PROVENANCE_NOTE,
} from "../charts/real-data";

export interface MatrixSectionProps {
  models?: string[];
  benchmarks?: string[];
  cells?: HeatmapCell[];
  loading?: boolean;
  error?: string | null;
  sortBy?: HeatSortBy;
  sortDir?: HeatSortDir;
  onSortChange?: (by: HeatSortBy, dir: HeatSortDir) => void;
  filter?: string;
  onFilterChange?: (f: string) => void;
  mode?: ThemeMode;
  onRetry?: () => void;
}

export function MatrixSection({
  models = [...REAL_HEATMAP_MODELS],
  benchmarks = [...REAL_HEATMAP_BENCHMARKS],
  cells = REAL_HEATMAP_CELLS,
  loading = false,
  error = null,
  sortBy,
  sortDir,
  onSortChange,
  filter,
  onFilterChange,
  mode,
  onRetry,
}: MatrixSectionProps) {
  const table = useMemo(() => heatmapToTable(models, benchmarks, cells), [models, benchmarks, cells]);

  return (
    <ChartShell
      title="Benchmark matrix"
      subtitle="Rows models, columns benchmarks. Color = normalized score; hover any cell for raw score, date, and runs."
      height={380}
      loading={loading}
      error={error}
      isEmpty={!cells.length}
      emptyMessage="Not enough measured data yet. See the data table below."
      table={table}
      tableId="benchmarks-table-matrix"
      onRetry={onRetry}
      footer={
        <span>
          One measured benchmark so far (zombie-flamethrower-showdown): Muse Spark 1.3 at 92 and
          Gemini 3.8 Flash at 88. Cells normalize each benchmark column to 0–1 so future suites
          share one scale. Raw scores, sample dates, and run counts are in the hover tooltip and
          table. {REAL_PROVENANCE_NOTE}.
        </span>
      }
    >
      <HeatmapMatrix
        models={models}
        benchmarks={benchmarks}
        cells={cells}
        sortBy={sortBy}
        sortDir={sortDir}
        onSortChange={onSortChange}
        filter={filter}
        onFilterChange={onFilterChange}
        height={380}
        mode={mode}
      />
    </ChartShell>
  );
}
