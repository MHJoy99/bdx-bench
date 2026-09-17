"use client";

/** Shared ECharts registration + responsive base component (internal).
 *
 *  Every public chart renders <EChartBase option height mode .../> which owns:
 *  - ResizeObserver resizing (spec: all charts responsive)
 *  - prefers-reduced-motion (animation off)
 *  - theme-aware text/axis defaults (dark #080A0D / light, accent #B8FF5A)
 */

import React, { useEffect, useMemo, useRef } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import {
  BarChart,
  BoxplotChart,
  HeatmapChart,
  LineChart,
  RadarChart as EChartsRadar,
  ScatterChart,
} from "echarts/charts";
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";
import type { ThemeMode } from "./types";
import { animationFor, echartsTheme, usePrefersReducedMotion } from "./theme";

echarts.use([
  BarChart,
  BoxplotChart,
  HeatmapChart,
  LineChart,
  EChartsRadar,
  ScatterChart,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  RadarComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapComponent,
  CanvasRenderer,
]);

export type { EChartsCoreOption };

export interface EChartBaseProps {
  option: EChartsCoreOption;
  height: number;
  mode: ThemeMode;
  ariaLabel: string;
  onEvents?: Record<string, (params: unknown) => void>;
}

export function EChartBase({ option, height, mode, ariaLabel, onEvents }: EChartBaseProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<ReactEChartsCore | null>(null);
  const reduced = usePrefersReducedMotion();

  const themed = useMemo<EChartsCoreOption>(() => {
    const t = echartsTheme(mode);
    return {
      ...animationFor(reduced),
      textStyle: { ...(t.textStyle as object), fontFamily: "inherit" },
      ...option,
    } as EChartsCoreOption;
  }, [mode, option, reduced]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const inst = chartRef.current?.getEchartsInstance?.();
      inst?.resize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} style={{ width: "100%", height }} role="img" aria-label={ariaLabel}>
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={themed}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer: "canvas" }}
        onEvents={onEvents}
      />
    </div>
  );
}
