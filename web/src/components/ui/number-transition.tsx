"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatScore } from "@/lib/format";
import { usePrefersReducedMotion } from "@/components/motion/polish-motion";

/**
 * Number microinteractions (SUB-AGENT 10/10 POLISH).
 * - NumberTransition: eased count between values on change (600ms, ease-out
 *   cubic, rAF). Instant under prefers-reduced-motion or non-finite input.
 * - RankChange: static rank-delta chip (no bounce/pulse). Color comes from
 *   status tokens so light/dark both pass contrast.
 */

/** Eased count from previous value to `value` whenever it changes. */
export function NumberTransition({
  value,
  format = formatScore,
  duration = 600,
  className,
}: {
  value: number;
  format?: (v: number) => string;
  duration?: number;
  className?: string;
}) {
  const reduce = usePrefersReducedMotion();
  const [display, setDisplay] = React.useState(value);
  const prevRef = React.useRef(value);

  React.useEffect(() => {
    const from = prevRef.current;
    if (
      from === value ||
      reduce ||
      duration <= 0 ||
      !Number.isFinite(from) ||
      !Number.isFinite(value)
    ) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        prevRef.current = value;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      prevRef.current = value;
    };
  }, [value, duration, reduce]);

  if (!Number.isFinite(display)) {
    return (
      <span className={cn("tnum", className)} aria-label="no value">
        —
      </span>
    );
  }
  return <span className={cn("tnum", className)}>{format(display)}</span>;
}

/** Rank delta chip: +n (up, success) / −n (down, danger) / — (flat, muted). */
export function RankChange({
  delta,
  className,
  showZero = true,
}: {
  delta: number;
  className?: string;
  showZero?: boolean;
}) {
  if (!Number.isFinite(delta)) return null;
  if (delta === 0) {
    if (!showZero) return null;
    return (
      <span
        title="No rank change"
        className={cn(
          "tnum inline-flex items-center gap-0.5 text-[12px] font-semibold text-[var(--text-tertiary)]",
          className,
        )}
      >
        <Minus className="size-3" aria-hidden />—
      </span>
    );
  }
  const up = delta > 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span
      title={up ? `Up ${delta} place${delta === 1 ? "" : "s"}` : `Down ${Math.abs(delta)} place${delta === -1 ? "" : "s"}`}
      className={cn(
        "tnum inline-flex items-center gap-0.5 text-[12px] font-semibold",
        up ? "text-[var(--success)]" : "text-[var(--danger)]",
        className,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {up ? `+${delta}` : delta}
    </span>
  );
}
