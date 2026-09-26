/**
 * BDX Bench — Motion System v2 tokens.
 *
 * Design authority: GPT Orchestrator (Senior Creative Director + Motion Lead),
 * reviewed 2026-09-26. Doctrine:
 *
 *   "No motion whose only purpose is to prove the site is animated.
 *    Motion must originate from computation, evidence, or artifact behavior."
 *
 * Allowed  : live game canvases (the artifact is alive), data + state
 *            transitions, audit replay, FLIP rank movement, score reveal.
 * Forbidden: decorative infinite loops, ambient particles, floating UI,
 *            parallax, "glowing" motion, playful bounce.
 *
 * The live game previews ARE the site's ambient motion layer. The chrome
 * around them stays deliberately quiet so the artifact reads as the hero.
 *
 * Every primitive here is transform/opacity/border-color only. No width,
 * height, margin, or grid animation anywhere (layout thrash), and everything
 * honours prefers-reduced-motion via MotionConfig reducedMotion="user".
 */

/** Duration scale in seconds (motion library convention). */
export const MOTION_DUR = {
  instant: 0.12,
  fast: 0.18,
  standard: 0.24,
  reveal: 0.42,
  dramatic: 0.6,
  /** Live build preview open/close. */
  preview: 0.32,
  /** Rank reordering FLIP. */
  flip: 0.5,
  /** Score number count-up. */
  score: 0.6,
  /** Dimension bar fill. */
  bar: 0.45,
  /** Changed-row border flash. */
  edge: 0.3,
} as const;

/** Signature easing curves. No bounce. "The interface responds." */
export const MOTION_EASE = {
  /** cubic-bezier(0.16, 1, 0.3, 1) — the workhorse. */
  out: [0.16, 1, 0.3, 1],
  /** cubic-bezier(0.22, 1, 0.36, 1) — FLIP + panel entrances. */
  flip: [0.22, 1, 0.36, 1],
  /** cubic-bezier(0.2, 0, 0, 1) — standard decelerate. */
  standard: [0.2, 0, 0, 1],
} as const;

export const MOTION_SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.8,
} as const;

/** Stagger between sibling items. */
export const MOTION_STAGGER = {
  /** Per-dimension audit bar. */
  dimension: 0.08,
  /** Per card in a grid. */
  card: 0.045,
  /** Per moved row during FLIP. */
  row: 0.04,
  /** Hard cap so long lists never feel sluggish. */
  maxTotal: 0.2,
} as const;

/** Delay after a card enters before its score starts counting. */
export const MOTION_SCORE_DELAY = 0.1;
/** Delay before the first dimension bar starts filling. */
export const MOTION_BAR_DELAY = 0.25;

export type Cubic = readonly [number, number, number, number];

/** Clamp a per-item index into a total stagger budget. */
export function staggerDelay(index: number, gap: number, maxTotal: number = MOTION_STAGGER.maxTotal) {
  return Math.min(Math.max(index, 0) * gap, maxTotal);
}
