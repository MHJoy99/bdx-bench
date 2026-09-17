"use client";

/** BarGroup — grouped benchmark comparison bars.
 *  Categories = benchmarks (x), one bar series per model.
 *  Tooltip carries Score, 95% CI, runs, variance note.
 */

import React, { useMemo } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { useChartMode } from "./theme";
import type { AriaTable, BarSeries, ThemeMode } from "./types";
import { esc, fmtPct } from "./utils";

export interface BarGroupProps {
  categories: string[];
  series: BarSeries[];
  horizontal?: boolean;
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
  onSelect?: (model: string, category: string) => void;
}

export function barsToTable(categories: string[], series: BarSeries[]): AriaTable {
  return {
    caption: "Benchmark scores by model, 0 to 1. Blank means no run.",
    columns: ["Benchmark", ...series.map((s) => s.name)],
    rows: categories.map((c, i) => [
      c,
      ...series.map((s) => {
        const v = s.data[i];
        return v == null ? "—" : v.toFixed(3);
      }),
    ]),
  };
}

export function BarGroup({
  categories,
  series,
  horizontal = false,
  height = 340,
  mode: modeProp,
  ariaLabel = "Benchmark comparison bar chart",
  onSelect,
}: BarGroupProps) {
  const mode = useChartMode(modeProp);
  const dark = mode === "dark";
  const muted = dark ? "#9AA4B2" : "#5B6672";
  const border = dark ? "#232A35" : "#E2E8E4";

  const option = useMemo<EChartsCoreOption>(() => {
    const tooltipFormatter = (params: unknown) => {
      const items = (Array.isArray(params) ? params : [params]) as Array<{
        seriesName?: string;
        value?: number | null;
        dataIndex?: number;
      }>;
      const idx = items[0]?.dataIndex ?? 0;
      const cat = categories[idx] ?? "?";
      const lines = items
        .map((it) => {
          const s = series.find((x) => x.name === it.seriesName);
          const v = it.value;
          const ci =
            s?.ciLow?.[idx] != null && s?.ciHigh?.[idx] != null
              ? ` <span style="opacity:.7">95% CI ${fmtPct(s.ciLow[idx])}–${fmtPct(s.ciHigh[idx])}</span>`
              : "";
          const runs = s?.runs?.[idx] != null ? ` <span style="opacity:.7">· ${s.runs[idx]} runs</span>` : "";
          return `${esc(it.seriesName ?? "?")}: <b>${v == null ? "—" : fmtPct(v)}</b>${ci}${runs}`;
        })
        .join("<br/>");
      return `<div><b>${esc(cat)}</b><br/>${lines}</div>`;
    };

    const categoryAxis = {
      type: "category" as const,
      data: categories,
      axisLabel: { color: muted, interval: 0, rotate: categories.length > 4 ? 18 : 0, fontSize: 11 },
      axisLine: { lineStyle: { color: border } },
      axisTick: { lineStyle: { color: border } },
    };
    const valueAxis = {
      type: "value" as const,
      min: 0,
      max: 1,
      axisLabel: { color: muted, formatter: (v: number) => fmtPct(v) },
      splitLine: { lineStyle: { color: border, type: "dashed" as const } },
    };

    return {
      grid: { left: 52, right: 16, top: 28, bottom: 60, containLabel: true },
      legend: { bottom: 0, textStyle: { color: muted, fontSize: 11 }, type: "scroll" },
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, confine: true, formatter: tooltipFormatter },
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxis,
      series: series.map((s) => ({
        type: "bar",
        name: s.name,
        data: s.data,
        barMaxWidth: 26,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        emphasis: { focus: "series" },
      })),
    } as EChartsCoreOption;
  }, [border, categories, muted, series, horizontal]);

  return (
    <EChartBase
      option={option}
      height={height}
      mode={mode}
      ariaLabel={ariaLabel}
      onEvents={
        onSelect
          ? { click: (p: unknown) => {
              const it = p as { seriesName?: string; name?: string };
              if (it.seriesName && it.name) onSelect(it.seriesName, it.name);
            } }
          : undefined
      }
    />
  );
}
