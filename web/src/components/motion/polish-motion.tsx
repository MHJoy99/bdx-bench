"use client";

import * as React from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  MOTION_BAR_DELAY,
  MOTION_DUR,
  MOTION_EASE,
  MOTION_SCORE_DELAY,
  MOTION_SPRING,
  MOTION_STAGGER,
  staggerDelay,
} from "@/lib/motion-tokens";
import { AUDIT_DIMENSIONS, dimensionStatus, type AuditDimensionKey } from "@/lib/audit-data";

/**
 * BDX Bench — Motion System v2 primitives.
 *
 * Authority: GPT Orchestrator creative review, 2026-09-26.
 * Doctrine: motion must originate from computation, evidence, or artifact
 * behavior — never from decoration. The live game previews are the ambient
 * motion layer; this chrome stays quiet.
 *
 * Rules enforced here:
 * - transform / opacity / border-color only. No width, height, margin, or grid
 *   animation anywhere (layout thrash).
 * - No decorative loops, floats, parallax, or ambient particles.
 * - `PolishMotionConfig` sets MotionConfig reducedMotion="user", so every
 *   primitive and any motion in children goes static under prefers-reduced-motion.
 *   App globals also kill CSS animation globally.
 */

export { usePrefersReducedMotion } from "@/components/charts/theme";

export { MOTION_DUR, MOTION_EASE, MOTION_SPRING, MOTION_STAGGER } from "@/lib/motion-tokens";

/** Wrap the app so ALL motion respects the OS reduced-motion setting. */
export function PolishMotionConfig({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* ------------------------------------------------------------------ *
 * Section entrances
 * ------------------------------------------------------------------ */

/** Once-only scroll entrance for section blocks. */
export function FadeIn({
  children,
  y = 6,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  y?: number;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-32px" }}
      transition={{ duration: MOTION_DUR.fast, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — pair with StaggerItem children. */
export function StaggerGroup({
  children,
  gap = MOTION_STAGGER.card,
  className,
}: {
  children: React.ReactNode;
  gap?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-32px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  y = 6,
  className,
}: {
  children: React.ReactNode;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: MOTION_DUR.fast, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Per-chart entrance (non-ECharts mounts; ECharts uses animationFor()). */
export function ChartEntrance({
  index = 0,
  y = 8,
  children,
  className,
}: {
  index?: number;
  y?: number;
  children: React.ReactNode;
  className?: string;
}) {
  const delay = staggerDelay(index, 0.035, 0.3);
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: MOTION_DUR.standard, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Spring tab indicator. Caller renders it inside the ACTIVE tab trigger. */
export function TabIndicator({
  layoutId,
  className,
}: {
  layoutId: string;
  className?: string;
}) {
  return (
    <motion.span
      aria-hidden
      layoutId={layoutId}
      transition={MOTION_SPRING}
      className={cn(
        "pointer-events-none absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-[var(--accent)]",
        className,
      )}
    />
  );
}

/* ------------------------------------------------------------------ *
 * SIGNATURE 1 — Live build preview open/close
 * 320ms · cubic-bezier(0.16,1,0.3,1) · scale 0.96 -> 1 + opacity + border-color.
 * The iframe mounts, we wait for its load event, then fade the live canvas in
 * so we never animate an empty black box.
 * ------------------------------------------------------------------ */

export function LivePreviewShell({
  open,
  playPath,
  title,
  className,
  children,
}: {
  open: boolean;
  playPath: string;
  title: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [painted, setPainted] = React.useState(false);
  const reduced = useReducedMotion();

  // Do not mount the iframe until the card is actually open, and drop it again
  // on close so a closed card costs zero frames.
  React.useEffect(() => {
    if (!open) setPainted(false);
  }, [open]);

  return (
    <AnimatePresence initial={false}>
      {open ? (
        <motion.div
          key="live-preview"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: MOTION_DUR.preview, ease: MOTION_EASE.out }}
          style={{ contain: "layout paint", transformOrigin: "center" }}
          className={cn(
            "relative overflow-hidden rounded-[10px] border border-[var(--accent-border)] bg-[var(--elevated)]",
            className,
          )}
        >
          <div
            className={cn(
              "relative aspect-video w-full transition-opacity duration-200",
              painted ? "opacity-100" : "opacity-0",
            )}
          >
            <iframe
              src={playPath}
              title={title}
              loading="lazy"
              tabIndex={-1}
              scrolling="no"
              allow="autoplay; fullscreen"
              onLoad={() => setPainted(true)}
              className="pointer-events-none absolute inset-0 h-full w-full border-0"
            />
          </div>
          {/* Static-first-frame fallback + reduced-motion gate: a user with
              reduced motion still gets the artifact, but must click Play. */}
          {(!painted || reduced) && children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ *
 * SIGNATURE 2 — Score reveal + dimension bar fill
 * Score number: 600ms easeOut (NOT a spring — numbers are measurement),
 * 100ms after the card enters. Bars: scaleX 0->1, 450ms, 250ms delay,
 * 80ms stagger per dimension, transform-origin left.
 * ------------------------------------------------------------------ */

export function ScoreReveal({
  value,
  decimals = 1,
  className,
  delay = MOTION_SCORE_DELAY,
  duration = MOTION_DUR.score,
}: {
  value: number;
  decimals?: number;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduced) {
      node.textContent = value.toFixed(decimals);
      return;
    }
    let raf = 0;
    let start = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min((now - start) / (duration * 1000), 1);
      node.textContent = (value * ease(t)).toFixed(decimals);
      if (t < 1) raf = requestAnimationFrame(tick);
      else node.textContent = value.toFixed(decimals);
    };
    const id = window.setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay * 1000);
    return () => {
      window.clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [value, decimals, delay, duration, reduced]);

  return (
    <span ref={ref} className={cn("tnum", className)}>
      {value.toFixed(decimals)}
    </span>
  );
}

/**
 * Single audit-dimension bar. scaleX only, origin left.
 *
 * The animated element must have non-zero area or `whileInView` never fires on
 * a zero-area target — so the full-width track is what we observe, and the
 * inner fill carries the transform.
 */
export function DimensionBar({
  dimension,
  points,
  index = 0,
  showLabel = true,
  className,
}: {
  dimension: (typeof AUDIT_DIMENSIONS)[number];
  points: number;
  index?: number;
  showLabel?: boolean;
  className?: string;
}) {
  const status = dimensionStatus(points);
  const delay = MOTION_BAR_DELAY + index * MOTION_STAGGER.dimension;
  return (
    <div className={cn("min-w-0", className)}>
      {showLabel ? (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="truncate text-[11px] text-[var(--text-secondary)]">
            {dimension.short}
          </span>
          <span className="tnum text-[11px] text-[var(--text)]">{points}</span>
        </div>
      ) : null}
      <motion.div
        className="h-1 w-full overflow-hidden rounded-full bg-[var(--elevated)]"
        role="img"
        aria-label={`${dimension.label}: ${points} of 20`}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-16px" }}
        variants={{ hidden: {}, show: {} }}
      >
        <motion.div
          className="h-full w-full rounded-full"
          style={{
            originX: 0,
            backgroundColor:
              status === "pass"
                ? "var(--accent)"
                : status === "partial"
                  ? "var(--warning)"
                  : "var(--danger)",
          }}
          variants={{
            hidden: { scaleX: 0, opacity: 0.6 },
            show: {
              scaleX: points / 20,
              opacity: 1,
              transition: { duration: MOTION_DUR.bar, delay, ease: MOTION_EASE.out },
            },
          }}
        />
      </motion.div>
    </div>
  );
}

/** All five audit dimensions for one build, staggered. */
export function DimensionBars({
  dims,
  className,
}: {
  dims: Record<AuditDimensionKey, number>;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-5", className)}>
      {AUDIT_DIMENSIONS.map((d, i) => (
        <DimensionBar key={d.key} dimension={d} points={dims[d.key]} index={i} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SIGNATURE 3 — Rank reordering FLIP
 * First/Last/Invert/Play on transform only. 500ms cubic-bezier(0.22,1,0.36,1),
 * 40ms per moved row capped at 200ms. A changed row flashes its left border
 * to lime for 300ms then returns — never a permanent pulse.
 * ------------------------------------------------------------------ */

export function FlipList({
  ids,
  order,
  renderItem,
  className,
  itemClassName,
}: {
  /** Stable ids, one per row. */
  ids: string[];
  /** Current visual order (subset/permutation of ids) after a data change. */
  order: string[];
  renderItem: (id: string, index: number) => React.ReactNode;
  className?: string;
  itemClassName?: string;
}) {
  const refs = React.useRef(new Map<string, HTMLElement>());
  const prev = React.useRef(new Map<string, number>());

  React.useLayoutEffect(() => {
    const next = new Map<string, number>();
    order.forEach((id, i) => {
      const el = refs.current.get(id);
      if (el) next.set(id, el.getBoundingClientRect().top);
    });
    // Invert + play for rows whose position actually changed.
    next.forEach((top, id) => {
      const before = prev.current.get(id);
      const el = refs.current.get(id);
      if (before != null && el && Math.abs(before - top) > 0.5) {
        el.animate(
          [{ transform: `translateY(${before - top}px)` }, { transform: "translateY(0)" }],
          { duration: 500, easing: "cubic-bezier(0.22,1,0.36,1)", fill: "none" },
        );
      }
    });
    prev.current = next;
  }, [order]);

  const setRef = (id: string) => (el: HTMLElement | null) => {
    if (el) refs.current.set(id, el);
    else refs.current.delete(id);
  };

  return (
    <div className={className}>
      {order.map((id, i) => (
        <div
          key={id}
          ref={setRef(id)}
          className={itemClassName}
          style={{ animationDelay: `${staggerDelay(i, MOTION_STAGGER.row) * 1000}ms` }}
        >
          {renderItem(id, i)}
        </div>
      ))}
    </div>
  );
}

/** Left-border flash for a row whose rank or score just changed. */
export function RankChangeEdge({ token }: { token: number }) {
  return (
    <motion.span
      aria-hidden
      key={token}
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 0 }}
      transition={{ duration: MOTION_DUR.edge, ease: "easeOut" }}
      className="pointer-events-none absolute inset-y-0 left-0 w-0.5 bg-[var(--accent)]"
    />
  );
}

/* ------------------------------------------------------------------ *
 * Overlays
 * ------------------------------------------------------------------ */

export interface DialogMotionProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  labelledBy?: string;
  label?: string;
}

export function DialogMotion({
  open,
  onClose,
  children,
  className,
  labelledBy,
  label = "Dialog",
}: DialogMotionProps) {
  return (
    <AnimatePresence>
      {open ? (
        <div
          key="wrap"
          className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto p-4"
          role="presentation"
        >
          <motion.div
            key="overlay"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="fixed inset-0 bg-[var(--overlay)]"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            {...(labelledBy ? { "aria-labelledby": labelledBy } : { "aria-label": label })}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: MOTION_DUR.standard, ease: MOTION_EASE.flip }}
            className={cn(
              "relative mt-[10vh] w-full max-w-lg rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-xl",
              className,
            )}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}

export interface CompareTrayMotionProps {
  open: boolean;
  children: React.ReactNode;
  className?: string;
  label?: string;
}

export function CompareTrayMotion({
  open,
  children,
  className,
  label = "Compare tray",
}: CompareTrayMotionProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="tray"
          role="region"
          aria-label={label}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: MOTION_DUR.standard, ease: MOTION_EASE.flip }}
          className={cn(
            "fixed inset-x-0 bottom-4 z-40 mx-auto w-[min(720px,calc(100%-2rem))] rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-3 text-[var(--text)] shadow-xl",
            className,
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
