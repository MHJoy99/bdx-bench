"use client";

/** RadarChart — capability polygon per model, evaluated axes only.
 *  Missing axes render as "Not evaluated" (table + tooltip); series omit
 *  the point so nothing is invented.
 */

import React, { useMemo } from "react";
import type { EChartsCoreOption } from "./EChartBase";
import { EChartBase } from "./EChartBase";
import { NOT_EVALUATED, REAL_PROVENANCE_NOTE } from "./real-data";
import { ACCENT, useChartMode } from "./theme";
import type { AriaTable, RadarDatum, ThemeMode } from "./types";
import { RADAR_AXES } from "./types";
import { esc, fmtPct } from "./utils";

export interface RadarChartProps {
  data: RadarDatum[];
  axes?: readonly string[] | string[];
  height?: number;
  mode?: ThemeMode;
  ariaLabel?: string;
  onSelect?: (model: string) => void;
}

export function radarValues(
  d: RadarDatum,
  axes: readonly string[],
): Array<number | null> {
  if (Array.isArray(d.values)) {
    const arr: Array<number | null> = d.values as Array<number | null>;
    return axes.map((_, i) => {
      const v = arr[i];
      return v == null || !Number.isFinite(v) ? null : Number(v);
    });
  }
  const rec = d.values as Record<string, number | null | undefined>;
  return axes.map((a) => {
    const v = rec[a];
    return v == null || !Number.isFinite(v) ? null : Number(v);
  });
}

export function radarToTable(data: RadarDatum[], axes: readonly string[]): AriaTable {
  return {
    caption:
      "Capability scores by model and axis, 0 to 1. Not evaluated means no measured run.",
    columns: ["Model", ...axes, "Runs"],
    rows: data.map((d) => [
      d.model,
      ...radarValues(d, axes).map((v) =>
        v == null ? NOT_EVALUATED : Number(v).toFixed(3),
      ),
      d.runs ?? NOT_EVALUATED,
    ]),
  };
}

/** Axes with at least one measured value across all models. */
export function evaluatedAxes(
  data: RadarDatum[],
  axes: readonly string[],
): string[] {
  return axes.filter((_, i) =>
    data.some((d) => radarValues(d, axes)[i] != null),
  );
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

  const axesList = useMemo(() => [...axes], [axes]);

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
          const item = p as { name?: string; value?: Array<number | null>; data?: RadarDatum };
          const d = (item.data ?? {}) as RadarDatum;
          const vals = Array.isArray(item.value) ? item.value : [];
          const rows = axesList
            .map(
              (a, i) => {
                const v = vals[i];
                return `<tr><td>${esc(a)}</td><td style="text-align:right"><b>${
                  v == null ? esc(NOT_EVALUATED) : fmtPct(v)
                }</b></td></tr>`;
              },
            )
            .join("");
          return (
            `<div><b>${esc(item.name ?? d.model ?? "?")}</b>` +
            (d.runs != null
              ? `<br/><span style="opacity:.7">runs: ${esc(d.runs)}</span>`
              : `<br/><span style="opacity:.7">${esc(NOT_EVALUATED)}</span>`) +
            `<table style="margin-top:4px">${rows}</table>` +
            `<div style="opacity:.7;margin-top:4px">${esc(REAL_PROVENANCE_NOTE)}</div></div>`
          );
        },
      },
      radar: {
        indicator: axesList.map((a) => ({ name: a, max: 1 })),
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
            // Null keeps the gap honest; ECharts skips null radar points.
            value: radarValues(d, axesList),
            runs: d.runs,
          })),
        },
      ],
      textStyle: { color: ink },
    } as EChartsCoreOption;
  }, [axesList, border, data, ink, muted]);

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
