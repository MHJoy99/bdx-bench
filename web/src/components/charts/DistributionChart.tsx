"use client";

/** DistributionChart — per-model run-score spread as boxplots + mean markers.
 *  Tooltip: median, q1/q3, mean, 95% CI, runs, variance.
 */

import React, { useMemo } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { useChartMode } from "./theme";
import type { AriaTable, DistributionSet, ThemeMode } from "./types";
import { boxStats, ci95, esc, fmtPct } from "./utils";

export interface DistributionChartProps {
  sets: DistributionSet[];
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
}

export function distributionsToTable(sets: DistributionSet[]): AriaTable {
  return {
    caption: "Run-score distribution summary by model.",
    columns: ["Model", "Runs", "Mean", "Median", "Q1", "Q3", "95% CI", "Variance"],
    rows: sets.map((s) => {
      const b = boxStats(s.values);
      const [lo, hi] = ci95(b.mean, b.n);
      return [
        s.model,
        b.n,
        fmtPct(b.mean),
        fmtPct(b.median),
        fmtPct(b.q1),
        fmtPct(b.q3),
        `${fmtPct(lo)}–${fmtPct(hi)}`,
        isFinite(b.variance) ? b.variance.toFixed(4) : "—",
      ];
    }),
  };
}

export function DistributionChart({
  sets,
  height = 340,
  mode: modeProp,
  ariaLabel = "Run score distribution by model",
}: DistributionChartProps) {
  const mode = useChartMode(modeProp);
  const dark = mode === "dark";
  const muted = dark ? "#9AA4B2" : "#5B6672";
  const border = dark ? "#232A35" : "#E2E8E4";

  const option = useMemo<EChartsCoreOption>(() => {
    const names = sets.map((s) => s.model);
    const boxes = sets.map((s) => {
      const b = boxStats(s.values);
      return [b.min, b.q1, b.median, b.q3, b.max, b.mean, b.variance, b.n];
    });

    return {
      grid: { left: 52, right: 16, top: 28, bottom: 48, containLabel: true },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 11 } },
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (p: unknown) => {
          const item = p as { seriesName?: string; dataIndex?: number; data?: unknown };
          const i = item.dataIndex ?? 0;
          const s = sets[i];
          const row = boxes[i];
          if (!s || !row) return "";
          const [min, q1, med, q3, max, m, v, n] = row as number[];
          const [lo, hi] = ci95(m ?? NaN, n ?? 0);
          return (
            `<div><b>${esc(s.model)}</b><br/>` +
            `Median: <b>${fmtPct(med)}</b> · mean: <b>${fmtPct(m)}</b><br/>` +
            `Q1 ${fmtPct(q1)} · Q3 ${fmtPct(q3)} · range ${fmtPct(min)}–${fmtPct(max)}<br/>` +
            `<span style="opacity:.75">Score 95% CI ${fmtPct(lo)}–${fmtPct(hi)} · ${n} runs · var ${(v ?? 0).toFixed(4)}</span></div>`
          );
        },
      },
      xAxis: {
        type: "category",
        data: names,
        axisLabel: { color: muted, fontSize: 11, interval: 0, rotate: names.length > 4 ? 18 : 0 },
        axisLine: { lineStyle: { color: border } },
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 1,
        axisLabel: { color: muted, formatter: (v: number) => fmtPct(v) },
        splitLine: { lineStyle: { color: border, type: "dashed" } },
      },
      series: [
        {
          type: "boxplot",
          name: "spread",
          data: boxes.map(([min, q1, med, q3, max]) => [min, q1, med, q3, max]),
          itemStyle: { borderWidth: 1.5 },
        },
        {
          type: "scatter",
          name: "mean",
          symbol: "diamond",
          symbolSize: 10,
          data: boxes.map((row, i) => [names[i], row?.[5]]),
          emphasis: { scale: 1.4 },
        },
      ],
    } as EChartsCoreOption;
  }, [border, muted, sets]);

  return <EChartBase option={option} height={height} mode={mode} ariaLabel={ariaLabel} />;
}
