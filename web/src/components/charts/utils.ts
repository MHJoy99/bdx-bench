"use client";

/** Math + formatting + ResizeObserver helpers shared by all charts. */

import { useEffect, useRef, useState } from "react";
import type { ScatterPoint, TrendRange, TrendSeries } from "./types";

/* ---------- formatting ---------- */

export function fmtScore(v: number | null | undefined, digits = 3): string {
  if (v == null || !isFinite(v)) return "—";
  return Number(v).toFixed(digits);
}

export function fmtPct(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "—";
  return `${Math.round(Number(v) * 100)}%`;
}

export function fmtCost(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "—";
  const n = Number(v);
  if (n >= 100) return `$${n.toFixed(0)}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  return `$${n.toFixed(3)}`;
}

export function fmtTps(v: number | null | undefined): string {
  if (v == null || !isFinite(v)) return "—";
  return `${Number(v).toFixed(0)} tok/s`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toISOString().slice(0, 10);
}

/** Minimal HTML escaper for tooltip strings (never inject raw model ids). */
export function esc(s: unknown): string {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c),
  );
}

/* ---------- stats ---------- */

/** Normal-approx 95% CI for a mean score in 0..1 given n runs. */
export function ci95(mean: number, n: number): [number, number] {
  if (!isFinite(mean) || n <= 0) return [NaN, NaN];
  const se = Math.sqrt(Math.max(0, mean * (1 - mean)) / n);
  const d = 1.96 * se;
  return [Math.max(0, mean - d), Math.min(1, mean + d)];
}

export function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN;
}

export function variance(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
}

export interface BoxStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  variance: number;
  n: number;
}

function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  const a = sorted[lo] ?? NaN;
  const b = sorted[hi] ?? NaN;
  return a + (b - a) * (pos - lo);
}

export function boxStats(values: number[]): BoxStats {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: sorted[0] ?? NaN,
    q1: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    q3: quantile(sorted, 0.75),
    max: sorted[sorted.length - 1] ?? NaN,
    mean: mean(values),
    variance: variance(values),
    n: values.length,
  };
}

/* ---------- Pareto frontier ---------- */

/**
 * Non-dominated set minimizing cost, maximizing score.
 * A point is dominated if another has <= cost AND >= score (strict on one).
 */
export function computePareto(points: ScatterPoint[]): ScatterPoint[] {
  const front = points.filter(
    (p) =>
      isFinite(p.blendedCost) &&
      isFinite(p.score) &&
      !points.some(
        (q) =>
          q !== p &&
          isFinite(q.blendedCost) &&
          isFinite(q.score) &&
          q.blendedCost <= p.blendedCost &&
          q.score >= p.score &&
          (q.blendedCost < p.blendedCost || q.score > p.score),
      ),
  );
  return front.sort((a, b) => a.blendedCost - b.blendedCost);
}

/* ---------- trend range filter ---------- */

const RANGE_DAYS: Record<TrendRange, number | null> = {
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
  ALL: null,
};

export function filterByRange<T extends { date: string }>(pts: T[], range: TrendRange, now = Date.now()): T[] {
  const days = RANGE_DAYS[range];
  if (days == null) return pts;
  const cutoff = now - days * 86_400_000;
  return pts.filter((p) => new Date(p.date).getTime() >= cutoff);
}

export function filterSeriesByRange(series: TrendSeries[], range: TrendRange, now = Date.now()): TrendSeries[] {
  return series.map((s) => ({ ...s, points: filterByRange(s.points, range, now) }));
}

/* ---------- ResizeObserver hook (spec: all charts responsive) ---------- */

export function useContainerWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(w);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
}
