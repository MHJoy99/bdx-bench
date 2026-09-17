"use client";

import * as React from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Polish motion primitives (SUB-AGENT 10/10 POLISH).
 *
 * Rules enforced here:
 * - Entrances only: opacity + 4–8px vertical moves, 120–220ms, ease-out.
 * - Springs ONLY for tab indicators (layoutId). Never for panels/trays.
 * - No loops, floats, parallax, or animation on table rows.
 * - `PolishMotionConfig` sets MotionConfig reducedMotion="user" so every
 *   primitive below (and any motion usage in children) goes static under
 *   prefers-reduced-motion. App globals also kill CSS animation globally.
 *
 * Canonical reduced-motion hook lives in charts/theme.ts (charts agent owns
 * it) — re-exported here so polish consumers import from one place.
 */

export { usePrefersReducedMotion } from "@/components/charts/theme";

/** Ease-out cubic shared by panel/tray entrances. */
export const POLISH_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const POLISH_DUR = {
  overlay: 0.16,
  panel: 0.2,
  fade: 0.18,
  staggerGap: 0.05,
} as const;

/**
 * Wrap the app (in Providers or layout) so ALL motion respects the OS
 * reduced-motion setting automatically. Additive — safe to nest.
 */
export function PolishMotionConfig({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

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
      transition={{ duration: POLISH_DUR.fade, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — pair with StaggerItem children. */
export function StaggerGroup({
  children,
  gap = POLISH_DUR.staggerGap,
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
        show: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Spring tab indicator. Caller renders it inside the ACTIVE tab trigger
 * (which must be `relative`) with a stable layoutId per tab group:
 *
 *   <TabsTrigger value="x" className="relative">
 *     {label}
 *     {active && <TabIndicator layoutId="leaderboard-tabs" />}
 *   </TabsTrigger>
 */
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
      transition={{ type: "spring", stiffness: 550, damping: 40 }}
      className={cn(
        "pointer-events-none absolute inset-x-2 bottom-0.5 h-0.5 rounded-full bg-[var(--accent)]",
        className,
      )}
    />
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
  const delay = Math.min(Math.max(index, 0) * 0.035, 0.3);
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-24px" }}
      transition={{ duration: 0.22, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export interface DialogMotionProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** Element id that labels the dialog (preferred). Falls back to aria-label. */
  labelledBy?: string;
  label?: string;
}

/**
 * Animated overlay + top-anchored panel (palette, dialogs).
 * Plain wrapper div stays keyed inside AnimatePresence so overlay/panel exit
 * animations complete via PresenceContext before unmount.
 */
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
            transition={{ duration: POLISH_DUR.overlay, ease: "easeOut" }}
            className="fixed inset-0 bg-[var(--overlay)]"
            onClick={onClose}
          />
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            {...(labelledBy
              ? { "aria-labelledby": labelledBy }
              : { "aria-label": label })}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: POLISH_DUR.panel, ease: POLISH_EASE }}
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

/** Bottom compare-tray transition: 8px rise + fade, 200ms. */
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
          transition={{ duration: 0.2, ease: POLISH_EASE }}
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
