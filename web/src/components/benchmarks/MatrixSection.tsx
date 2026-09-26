"use client";

/** MatrixSection — route-support block for /benchmarks (NOT a page).
 *
 *  Data source is the audit trail, not a hand-typed chart fixture. Rows are the
 *  ten audited builds; columns are the five audit dimensions, so the chart is a
 *  build x dimension coverage map rather than a single-column "benchmark".
 *  Colour is the normalized 0–1 form of points-of-20, which is what the
 *  visualMap expects; the tooltip and the fallback table carry the raw points.
 *
 *  Canonical vs secondary builds are NOT hidden: both models that shipped two
 *  audited builds appear, because omitting the weaker build would be exactly
 *  the kind of curation this benchmark exists to avoid.
 */

import React, { useMemo } from "react";
import { ChartShell } from "../charts/ChartShell";
import { HeatmapMatrix, heatmapToTable, type HeatSortBy, type HeatSortDir } from "../charts/HeatmapMatrix";
import type { HeatmapCell, ThemeMode } from "../charts/types";
import { AUDIT_DIMENSIONS, AUDIT_TRAIL, dimensionStatus } from "@/lib/audit-data";

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

/** Row label per audited build: the build, disambiguated by model when needed. */
const ROWS: string[] = AUDIT_TRAIL.map((e) => e.buildName);

/** Column label per audit dimension, with the point ceiling made explicit. */
const COLUMNS: string[] = AUDIT_DIMENSIONS.map((d) => `${d.short} /20`);

/** buildName + dimension -> points of 20, normalized 0–1 for the color scale. */
const AUDIT_CELLS: HeatmapCell[] = AUDIT_TRAIL.flatMap((entry) =>
  AUDIT_DIMENSIONS.map((dimension) => {
    const points = entry.dims[dimension.key];
    return {
      model: entry.buildName,
      benchmark: `${dimension.short} /20`,
      raw: points,
      normalized: points / 20,
      date: entry.generated,
      runs: 1,
    };
  }),
);

const STATUS_TALLY = AUDIT_TRAIL.reduce(
  (acc, entry) => {
    for (const dimension of AUDIT_DIMENSIONS) {
      acc[dimensionStatus(entry.dims[dimension.key])] += 1;
    }
    return acc;
  },
  { pass: 0, partial: 0, fail: 0 } as Record<"pass" | "partial" | "fail", number>,
);

export function MatrixSection({
  models = ROWS,
  benchmarks = COLUMNS,
  cells = AUDIT_CELLS,
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
      title="Audit coverage — every build x every dimension"
      subtitle={`Rows are all ${AUDIT_TRAIL.length} audited builds, columns are the ${AUDIT_DIMENSIONS.length} audit dimensions. Color is points of 20; hover or open the table for the raw number and audit date.`}
      height={AUDIT_TRAIL.length * 44 + 90}
      loading={loading}
      error={error}
      isEmpty={!cells.length}
      emptyMessage="No audited builds in the trail yet. See the data table below."
      table={table}
      tableId="benchmarks-table-matrix"
      onRetry={onRetry}
      footer={
        <span>
          {STATUS_TALLY.pass} passing cells, {STATUS_TALLY.partial} partial pass,{" "}
          {STATUS_TALLY.fail} failing across {AUDIT_TRAIL.length * AUDIT_DIMENSIONS.length}{" "}
          scored cells. Thresholds follow the audit contract: 16+ is a pass, 10–15 a
          partial pass, below 10 a failure. Raw values are unmodified audit points
          out of 20; the colour scale is those points normalized to 0–1.
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
        height={AUDIT_TRAIL.length * 44 + 90}
        mode={mode}
        ariaLabel="Heatmap of audit points per dimension for every audited build"
      />
    </ChartShell>
  );
}
