"use client";

/** HeatmapMatrix — rows = models, cols = benchmarks, color = normalized 0..1.
 *  Hover shows raw + normalized + date + runs. Sort/filter via props
 *  (controlled) with uncontrolled fallbacks so pages can URL-sync or not.
 */

import React, { useMemo, useState } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { NOT_EVALUATED, REAL_PROVENANCE_NOTE } from "./real-data";
import { ACCENT, useChartMode } from "./theme";
import type { AriaTable, HeatmapCell, ThemeMode } from "./types";
import { esc, fmtDate } from "./utils";

export type HeatSortBy = "name" | "avg";
export type HeatSortDir = "asc" | "desc";

export interface HeatmapMatrixProps {
  models: string[];
  benchmarks: string[];
  cells: HeatmapCell[];
  sortBy?: HeatSortBy;
  sortDir?: HeatSortDir;
  onSortChange?: (sortBy: HeatSortBy, dir: HeatSortDir) => void;
  filter?: string;
  onFilterChange?: (f: string) => void;
  showControls?: boolean;
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
}

export function heatmapToTable(models: string[], benchmarks: string[], cells: HeatmapCell[]): AriaTable {
  const byKey = new Map(cells.map((c) => [`${c.model}¦${c.benchmark}`, c]));
  return {
    caption: "Raw benchmark scores by model. Not evaluated means no measured run.",
    columns: ["Model", ...benchmarks],
    rows: models.map((m) => [
      m,
      ...benchmarks.map((b) => {
        const c = byKey.get(`${m}¦${b}`);
        return c?.raw == null || !Number.isFinite(c.raw) ? NOT_EVALUATED : c.raw.toFixed(3);
      }),
    ]),
  };
}

function rowAvg(model: string, cells: HeatmapCell[]): number {
  const vals = cells.filter((c) => c.model === model && c.raw != null).map((c) => c.raw as number);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : -1;
}

export function HeatmapMatrix({
  models,
  benchmarks,
  cells,
  sortBy: sortByProp,
  sortDir: sortDirProp,
  onSortChange,
  filter: filterProp,
  onFilterChange,
  showControls = true,
  height = 360,
  mode: modeProp,
  ariaLabel = "Model by benchmark score heatmap",
}: HeatmapMatrixProps) {
  const mode = useChartMode(modeProp);
  const dark = mode === "dark";
  const muted = dark ? "#9AA4B2" : "#5B6672";
  const border = dark ? "#232A35" : "#E2E8E4";

  const [innerSort, setInnerSort] = useState<HeatSortBy>("avg");
  const [innerDir, setInnerDir] = useState<HeatSortDir>("desc");
  const [innerFilter, setInnerFilter] = useState("");
  const sortBy = sortByProp ?? innerSort;
  const sortDir = sortDirProp ?? innerDir;
  const filter = (filterProp ?? innerFilter).toLowerCase();

  const rows = useMemo(() => {
    const kept = models.filter((m) => m.toLowerCase().includes(filter));
    const dir = sortDir === "asc" ? 1 : -1;
    return [...kept].sort((a, b) =>
      sortBy === "name" ? dir * a.localeCompare(b) : dir * (rowAvg(a, cells) - rowAvg(b, cells)),
    );
  }, [models, filter, sortBy, sortDir, cells]);

  const option = useMemo<EChartsCoreOption>(() => {
    const byKey = new Map(cells.map((c) => [`${c.model}¦${c.benchmark}`, c]));
    const data: Array<[number, number, number, string, string]> = [];
    rows.forEach((m, y) => {
      benchmarks.forEach((b, x) => {
        const c = byKey.get(`${m}¦${b}`);
        data.push([x, y, c ? c.normalized : -1, m, b]);
      });
    });
    return {
      grid: { left: 8, right: 12, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        confine: true,
        formatter: (p: unknown) => {
          const item = p as { value?: [number, number, number, string, string] };
          const [, , , m, b] = item.value ?? [-1, -1, -1, "?", "?"];
          const c = byKey.get(`${m}¦${b}`);
          if (!c || c.raw == null || !Number.isFinite(c.raw))
            return `<div><b>${esc(m)}</b> · ${esc(b)}<br/><span style="opacity:.7">${esc(NOT_EVALUATED)}</span><br/><span style="opacity:.7">${esc(REAL_PROVENANCE_NOTE)}</span></div>`;
          return (
            `<div><b>${esc(m)}</b> · ${esc(b)}<br/>` +
            `Raw: <b>${c.raw.toFixed(3)}</b> · normalized: <b>${c.normalized.toFixed(2)}</b>` +
            (c.date ? `<br/>Date: ${esc(fmtDate(c.date))}` : "") +
            (c.runs != null ? ` · runs: ${esc(c.runs)}` : "") +
            `<br/><span style="opacity:.7">${esc(REAL_PROVENANCE_NOTE)}</span>` +
            `</div>`
          );
        },
      },
      xAxis: {
        type: "category",
        data: benchmarks,
        splitArea: { show: true },
        axisLabel: { color: muted, fontSize: 11, interval: 0, rotate: benchmarks.length > 4 ? 20 : 0 },
      },
      yAxis: {
        type: "category",
        data: rows,
        inverse: true,
        splitArea: { show: true },
        axisLabel: { color: muted, fontSize: 11 },
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: "horizontal",
        left: "center",
        bottom: 0,
        textStyle: { color: muted, fontSize: 10 },
        inRange: {
          color: dark
            ? ["#1a2113", "#3d5222", "#7ba63a", ACCENT]
            : ["#eef6e3", "#d3e9b4", "#b8ff5a", "#4d7c0f"],
        },
      },
      series: [
        {
          type: "heatmap",
          data: data.map(([x, y, v]) => ({ value: [x, y, v] })),
          label: {
            show: true,
            fontSize: 10,
            color: dark ? "#F2F5F4" : "#0B0E0C",
            formatter: (p: unknown) => {
              const v = (p as { value?: [number, number, number] }).value?.[2];
              return v == null || v < 0 ? NOT_EVALUATED : v.toFixed(2);
            },
          },
          itemStyle: { borderColor: border, borderWidth: 2, borderRadius: 4 },
          emphasis: { itemStyle: { shadowBlur: 0, borderColor: ACCENT } },
        },
      ],
    } as EChartsCoreOption;
  }, [ACCENT, benchmarks, border, cells, dark, muted, rows]);

  const setSort = (by: HeatSortBy, dir: HeatSortDir) => {
    setInnerSort(by);
    setInnerDir(dir);
    onSortChange?.(by, dir);
  };
  const setFilter = (f: string) => {
    setInnerFilter(f);
    onFilterChange?.(f);
  };

  return (
    <div>
      {showControls ? (
        <div className="bdx-chip-row" style={{ marginBottom: 10 }}>
          <input
            className="bdx-input"
            type="search"
            placeholder="Filter models…"
            aria-label="Filter models"
            value={filterProp ?? innerFilter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ minWidth: 180 }}
          />
          <select
            className="bdx-select"
            aria-label="Sort rows"
            value={`${sortBy}:${sortDir}`}
            onChange={(e) => {
              const [by, dir] = e.target.value.split(":") as [HeatSortBy, HeatSortDir];
              setSort(by, dir);
            }}
          >
            <option value="avg:desc">Top scoring first</option>
            <option value="avg:asc">Lowest scoring first</option>
            <option value="name:asc">Name A–Z</option>
            <option value="name:desc">Name Z–A</option>
          </select>
        </div>
      ) : null}
      <EChartBase option={option} height={Math.max(height, rows.length * 44 + 90)} mode={mode} ariaLabel={ariaLabel} />
    </div>
  );
}
