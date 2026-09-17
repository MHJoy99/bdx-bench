import type { ScoreSnapshot } from "@/lib/types";

/**
 * SINGLE scoring contract for BDX Bench.
 * All feature agents must use these functions — do not re-implement weighting.
 *
 * Weighting config (sums to 1.00):
 *   Reasoning 20 / Coding 20 / Knowledge 15 / Math 15 /
 *   Vision 10 / Agentic 10 / LongContext 5 / Efficiency 5
 */

export const BDX_WEIGHTS = {
  reasoning: 0.2,
  coding: 0.2,
  knowledge: 0.15,
  math: 0.15,
  vision: 0.1,
  agentic: 0.1,
  longContext: 0.05,
  efficiency: 0.05,
} as const;

export type BdxWeightKey = keyof typeof BDX_WEIGHTS;

/** Min-max normalize a raw 0-100 score into 0-100 given observed min/max. */
export function normalizedScore(
  raw: number,
  min: number,
  max: number,
): number {
  if (!Number.isFinite(raw) || !Number.isFinite(min) || !Number.isFinite(max))
    return 0;
  if (max <= min) return raw >= max ? 100 : 0;
  const n = ((raw - min) / (max - min)) * 100;
  return Math.min(100, Math.max(0, Math.round(n * 10) / 10));
}

type CompositeInput = Pick<
  ScoreSnapshot,
  | "reasoning"
  | "coding"
  | "knowledge"
  | "math"
  | "vision"
  | "agentic"
> & {
  longContext?: number;
  efficiency?: number;
};

/**
 * BDX Bench Score — weighted composite of subscores (0-100).
 * Missing longContext/efficiency fall back to the mean of present dims
 * so legacy snapshots without them still score fairly.
 */
export function bdxBenchScore(s: CompositeInput): number {
  const present = [s.reasoning, s.coding, s.knowledge, s.math, s.vision, s.agentic];
  const mean = present.reduce((a, b) => a + b, 0) / present.length;
  const lc = s.longContext ?? mean;
  const eff = s.efficiency ?? mean;
  const total =
    s.reasoning * BDX_WEIGHTS.reasoning +
    s.coding * BDX_WEIGHTS.coding +
    s.knowledge * BDX_WEIGHTS.knowledge +
    s.math * BDX_WEIGHTS.math +
    s.vision * BDX_WEIGHTS.vision +
    s.agentic * BDX_WEIGHTS.agentic +
    lc * BDX_WEIGHTS.longContext +
    eff * BDX_WEIGHTS.efficiency;
  return Math.round(total * 10) / 10;
}

/** Human label for a composite score. */
export function scoreLabel(score: number): string {
  if (score >= 90) return "Elite";
  if (score >= 80) return "Excellent";
  if (score >= 70) return "Strong";
  if (score >= 60) return "Capable";
  if (score >= 50) return "Developing";
  return "Emerging";
}

/** 0-100 score with one decimal, e.g. 92.4 -> "92.4". Non-finite -> "—". */
export function formatScore(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(1);
}

/**
 * Signed delta, two call shapes (merged Agent1 + Agent8 contract):
 * - formatDelta(delta) — precomputed delta, e.g. 1.2 -> "+1.2".
 * - formatDelta(current, previous) — diff of two scores, e.g. (82, 80) -> "+2.0".
 */
export function formatDelta(delta: number): string;
export function formatDelta(current: number, previous: number): string;
export function formatDelta(a: number, b?: number): string {
  const d = b === undefined ? a : a - b;
  if (!Number.isFinite(d)) return "—";
  const v = Math.round(d * 10) / 10;
  if (v === 0) return b === undefined ? "0.0" : "±0.0";
  const sign = v > 0 ? "+" : "−";
  return `${sign}${Math.abs(v).toFixed(1)}`;
}

/** Blended price per 1M tokens (3:1 input:output weighting). */
export function blendedPricePer1M(inputPer1M: number, outputPer1M: number): number {
  return Math.round((inputPer1M * 0.75 + outputPer1M * 0.25) * 100) / 100;
}
