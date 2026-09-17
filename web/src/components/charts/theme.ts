"use client";

/** Theme tokens + ECharts theme factory. Single source of truth for viz color.
 *
 *  Dark surface MUST be #080A0D, accent MUST be #B8FF5A (brand tokens, also in
 *  tailwind.config.ts `bdx`). Light theme is paper white with ink text.
 *  Components never hardcode colors — they call `echartsTheme(mode)`.
 */

import { useEffect, useState } from "react";
import type { ThemeMode } from "./types";

export const ACCENT = "#B8FF5A";
export const DARK_BG = "#080A0D";
export const DARK_SURFACE = "#0F1217";
export const DARK_BORDER = "#232A35";
export const DARK_INK = "#F2F5F4";
export const DARK_MUTED = "#9AA4B2";
export const LIGHT_BG = "#FFFFFF";
export const LIGHT_SURFACE = "#F4F6F4";
export const LIGHT_BORDER = "#E2E8E4";
export const LIGHT_INK = "#0B0E0C";
export const LIGHT_MUTED = "#5B6672";

/** Categorical palette: accent first, then colorblind-tolerant companions. */
export const CATEGORY_PALETTE = [
  ACCENT,
  "#7DD3FC",
  "#C4B5FD",
  "#FCA5A5",
  "#FCD34D",
  "#6EE7B7",
  "#F9A8D4",
  "#93C5FD",
] as const;

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Resolve dark/light without importing next-themes (zero coupling):
 * explicit prop wins, else <html class="dark"> / data-theme, else OS setting.
 */
export function useChartMode(explicit?: ThemeMode): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>(explicit ?? "dark");
  useEffect(() => {
    if (explicit) {
      setMode(explicit);
      return;
    }
    const read = (): ThemeMode => {
      const el = document.documentElement;
      const attr = el.getAttribute("data-theme");
      if (attr === "light" || attr === "dark") return attr;
      if (el.classList.contains("dark")) return "dark";
      if (el.classList.contains("light")) return "light";
      return window.matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
    };
    setMode(read());
    const obs = new MutationObserver(() => setMode(read()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => obs.disconnect();
  }, [explicit]);
  return mode;
}

/** Shared ECharts base: transparent bg (Shell paints surface), themed axes. */
export function echartsTheme(mode: ThemeMode) {
  const dark = mode === "dark";
  const ink = dark ? DARK_INK : LIGHT_INK;
  const muted = dark ? DARK_MUTED : LIGHT_MUTED;
  const border = dark ? DARK_BORDER : LIGHT_BORDER;
  return {
    color: [...CATEGORY_PALETTE],
    backgroundColor: "transparent",
    textStyle: { color: ink, fontFamily: "inherit" },
    tooltip: {
      backgroundColor: dark ? "#151920" : "#FFFFFF",
      borderColor: dark ? DARK_BORDER : LIGHT_BORDER,
      textStyle: { color: ink, fontSize: 12 },
    },
    categoryAxis: {
      axisLine: { lineStyle: { color: border } },
      axisTick: { lineStyle: { color: border } },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: border } },
    },
    valueAxis: {
      axisLine: { lineStyle: { color: border } },
      axisLabel: { color: muted },
      splitLine: { lineStyle: { color: border, type: "dashed" as const } },
    },
  };
}

/** Animation toggle honoring prefers-reduced-motion (spec requirement). */
export function animationFor(reduced: boolean) {
  return reduced
    ? { animation: false, animationDuration: 0, animationEasing: "linear" as const }
    : { animation: true, animationDuration: 450, animationDurationUpdate: 300 };
}
