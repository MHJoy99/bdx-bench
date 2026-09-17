"use client";

/** MatrixSection — route-support block for /benchmarks (NOT a page).
 *  Pages own routing/fetch; this owns heatmap wiring + sort/filter controls.
 */

import React, { useMemo } from "react";
import { ChartShell } from "../charts/ChartShell";
import { HeatmapMatrix, heatmapToTable, type HeatSortBy, type HeatSortDir } from "../charts/HeatmapMatrix";
import type { HeatmapCell, ThemeMode } from "../charts/types";
import { DEMO_HEATMAP_BENCHMARKS, DEMO_HEATMAP_CELLS, DEMO_HEATMAP_MODELS } from "../charts/demo";

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
  models = DEMO_HEATMAP_MODELS,
  benchmarks = DEMO_HEATMAP_BENCHMARKS,
  cells = DEMO_HEATMAP_CELLS,
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
      emptyMessage="No matrix cells for this filter."
      table={table}
      onRetry={onRetry}
      footer={
        <span>
          Cells normalize each benchmark column to 0–1 so strong and weak suites share one
          scale. Raw scores, sample dates, and run counts are in the hover tooltip and table.
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
