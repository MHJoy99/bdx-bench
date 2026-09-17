"use client";

/** RadarChart — 7-axis capability polygon per model.
 *  Axes (fixed order): Reasoning Coding Math Knowledge Vision Agentic Efficiency.
 */

import React, { useMemo } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { ACCENT, useChartMode } from "./theme";
import type { AriaTable, RadarDatum, RadarAxis, ThemeMode } from "./types";
import { RADAR_AXES } from "./types";
import { esc, fmtPct } from "./utils";

export interface RadarChartProps {
  data: RadarDatum[];
  axes?: readonly RadarAxis[] | RadarAxis[];
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
  onSelect?: (model: string) => void;
}

export function radarValues(d: RadarDatum, axes: readonly string[]): number[] {
  if (Array.isArray(d.values)) {
    const arr: number[] = d.values;
    return axes.map((_, i) => arr[i] ?? 0);
  }
  const rec: Record<string, number> = d.values;
  return axes.map((a) => rec[a] ?? 0);
}

export function radarToTable(data: RadarDatum[], axes: readonly string[]): AriaTable {
  return {
    caption: "Capability scores by model and axis, 0 to 1.",
    columns: ["Model", ...axes, "Runs"],
    rows: data.map((d) => [
      d.model,
      ...radarValues(d, axes).map((v) => v.toFixed(3)),
      d.runs ?? "—",
    ]),
  };
}

export function RadarChart({
  data,
  axes = RADAR_AXES,
  height = 340,
  mode: modeProp,
  ariaLabel = "Capability radar chart",
  onSelect,
}: RadarChartProps) {
  const mode = useChartMode(modeProp);
  const dark = mode === "dark";
  const ink = dark ? "#F2F5F4" : "#0B0E0C";
  const muted = dark ? "#9AA4B2" : "#5B6672";
  const border = dark ? "#232A35" : "#E2E8E4";

  const option = useMemo<EChartsCoreOption>(() => {
    return {
      color: [ACCENT, "#7DD3FC", "#C4B5FD", "#FCA5A5", "#FCD34D"],
      legend: {
        bottom: 0,
        textStyle: { color: muted, fontSize: 11 },
        icon: "roundRect",
        itemWidth: 12,
        itemHeight: 8,
      },
      tooltip: {
        trigger: "item",
        confine: true,
        formatter: (p: unknown) => {
          const item = p as { name?: string; value?: number[]; data?: RadarDatum };
          const d = (item.data ?? {}) as RadarDatum;
          const vals = Array.isArray(item.value) ? item.value : [];
          const rows = axes
            .map((a, i) => `<tr><td>${esc(a)}</td><td style="text-align:right"><b>${fmtPct(vals[i])}</b></td></tr>`)
            .join("");
          return (
            `<div><b>${esc(item.name ?? d.model ?? "?")}</b>` +
            (d.runs != null ? `<br/><span style="opacity:.7">runs: ${esc(d.runs)}</span>` : "") +
            `<table style="margin-top:4px">${rows}</table></div>`
          );
        },
      },
      radar: {
        indicator: axes.map((a) => ({ name: a, max: 1 })),
        center: ["50%", "52%"],
        radius: "62%",
        axisName: { color: muted, fontSize: 11 },
        splitArea: { areaStyle: { color: ["transparent"] } },
        splitLine: { lineStyle: { color: border } },
        axisLine: { lineStyle: { color: border } },
      },
      series: [
        {
          type: "radar",
          symbolSize: 4,
          lineStyle: { width: 2 },
          emphasis: { lineStyle: { width: 3 } },
          data: data.map((d) => ({
            name: d.model,
            value: radarValues(d, [...axes]),
            runs: d.runs,
          })),
        },
      ],
      textStyle: { color: ink },
    } as EChartsCoreOption;
  }, [axes, border, data, ink, muted]);

  return (
    <EChartBase
      option={option}
      height={height}
      mode={mode}
      ariaLabel={ariaLabel}
      onEvents={
        onSelect
          ? { click: (p: unknown) => {
              const name = (p as { name?: string }).name;
              if (name) onSelect(name);
            } }
          : undefined
      }
    />
  );
}
