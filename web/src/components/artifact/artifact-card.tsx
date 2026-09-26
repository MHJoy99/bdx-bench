"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Gamepad2, Pause, Play, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { MOTION_EASE, MOTION_STAGGER } from "@/lib/motion-tokens";
import {
  AUDIT_BY_BUILD,
  AUDIT_TRAIL,
  SEVERITY_LABEL,
  dimensionStatus,
  type AuditEntry,
  type AuditFinding,
} from "@/lib/audit-data";
import { LivePreviewShell, ScoreReveal } from "@/components/motion/polish-motion";

/**
 * ArtifactCard — the hero object of the site.
 *
 * Creative direction: "GitHub for AI-generated software artifacts."
 * Hierarchy is artifact -> evidence -> score -> model identity. So the card
 * leads with the actual playable build (a live canvas, not a screenshot),
 * then the evidence that produced the score, then the number, then the model.
 *
 * The live canvas IS the site's ambient motion layer. It is gated:
 * - only mounts when expanded (a closed card costs zero frames)
 * - only plays while the card is in view (IntersectionObserver)
 * - never autoplays under prefers-reduced-motion; the user clicks Play
 */

function useInView<T extends HTMLElement>(threshold = 0.35) {
  const ref = React.useRef<T>(null);
  const [inView, setInView] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.find((e) => e.isIntersecting);
        if (hit) setInView(hit.intersectionRatio >= threshold);
      },
      { threshold: [0, threshold, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function SeverityDot({ severity }: { severity: AuditFinding["severity"] }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-1 inline-block size-1.5 shrink-0 rounded-full",
        severity === "high" && "bg-[var(--danger)]",
        severity === "medium" && "bg-[var(--warning)]",
        severity === "low" && "bg-[var(--text-tertiary)]",
      )}
    />
  );
}

/** The credibility weapon: verified defects, worst first. Never hidden. */
export function AuditFindings({
  findings,
  defaultOpen = 0,
  className,
}: {
  findings: AuditFinding[];
  defaultOpen?: number;
  className?: string;
}) {
  const sorted = React.useMemo(
    () =>
      [...findings].sort(
        (a, b) =>
          ({ high: 0, medium: 1, low: 2 })[a.severity] -
          ({ high: 0, medium: 1, low: 2 })[b.severity],
      ),
    [findings],
  );
  const [open, setOpen] = React.useState<number | null>(
    defaultOpen > 0 ? null : null,
  );
  const high = sorted.filter((f) => f.severity === "high").length;

  return (
    <div className={cn("rounded-[10px] border border-[var(--border)] bg-[var(--elevated)]", className)}>
      <button
        type="button"
        onClick={() => setOpen(open === null ? 0 : null)}
        aria-expanded={open !== null}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--surface)]"
      >
        <span className="flex items-center gap-2 text-[12px] font-medium text-[var(--text)]">
          <TriangleAlert className="size-3.5 text-[var(--warning)]" aria-hidden="true" />
          Findings ({sorted.length})
          {high > 0 ? (
            <span className="rounded-full bg-[var(--danger-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--danger)]">
              {high} failing
            </span>
          ) : null}
        </span>
        <span className="text-[11px] text-[var(--text-tertiary)]">
          {open === null ? "Show" : "Hide"}
        </span>
      </button>
      {open !== null ? (
        <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
          {sorted.map((f, i) => (
            <li key={f.title} className="flex gap-2 px-3 py-2">
              <SeverityDot severity={f.severity} />
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[var(--text)]">{f.title}</p>
                <p className="mt-0.5 text-[11px] leading-[16px] text-[var(--text-secondary)]">
                  {f.impact}
                </p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {SEVERITY_LABEL[f.severity]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export interface ArtifactCardProps {
  entry: AuditEntry;
  /** Optional alternate playable build (a model shipped more than one). */
  altEntry?: AuditEntry;
  className?: string;
  index?: number;
}

/**
 * The centerpiece. Live artifact first, then evidence, then score, then model.
 */
export function ArtifactCard({ entry, altEntry, className, index = 0 }: ArtifactCardProps) {
  const [playing, setPlaying] = React.useState(false);
  const [wrapRef, inView] = useInView<HTMLDivElement>(0.4);

  // Off-screen cards stop rendering their game. A benchmark site should not
  // waste CPU, and the motion budget is spent on what is actually visible.
  const showLive = playing && inView;

  const highFailures = entry.findings.filter((f) => f.severity === "high").length;

  return (
    <div
      ref={wrapRef}
      className={cn(
        "group flex flex-col overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)] transition-colors hover:border-[var(--border-strong)]",
        className,
      )}
      style={{ contain: "layout paint" }}
    >
      {/* 1. ARTIFACT ------------------------------------------------- */}
      <div className="relative border-b border-[var(--border)] bg-[var(--elevated)]">
        {showLive ? (
          <LivePreviewShell
            open
            playPath={entry.playPath}
            title={`${entry.buildName} by ${entry.modelName}`}
          >
            <div className="flex aspect-video w-full items-center justify-center bg-[var(--elevated)]">
              <Gamepad2 className="size-6 text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>
          </LivePreviewShell>
        ) : (
          <div className="relative flex aspect-video w-full items-center justify-center">
            {/* Idle state is a factual readout, not a fake screenshot. */}
            <div className="w-full px-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {entry.buildId}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                  {entry.generated}
                </span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--border-strong)]"
                  style={{ transform: `scaleX(${entry.total / 100})`, transformOrigin: "left" }}
                />
              </div>
              <p className="mt-2 line-clamp-2 text-[11px] leading-[15px] text-[var(--text-secondary)]">
                {entry.implements[0]}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPlaying(true)}
              className="absolute inset-0 flex items-center justify-center bg-[var(--overlay)] opacity-0 transition-opacity duration-200 focus-visible:opacity-100 group-hover:opacity-100"
            >
              <span className="flex items-center gap-1.5 rounded-[8px] bg-[var(--accent)] px-3 py-2 text-[12px] font-semibold text-[var(--accent-foreground)]">
                <Play className="size-3.5" aria-hidden="true" />
                Run in place
              </span>
            </button>
          </div>
        )}
        {showLive ? (
          <button
            type="button"
            onClick={() => setPlaying(false)}
            className="absolute right-2 top-2 flex items-center gap-1 rounded-[6px] border border-[var(--border)] bg-[var(--overlay)] px-1.5 py-1 text-[10px] text-[var(--text-secondary)] backdrop-blur-sm transition-colors hover:text-[var(--text)]"
          >
            <Pause className="size-3" aria-hidden="true" />
            Stop
          </button>
        ) : null}
      </div>

      {/* 2. EVIDENCE + 3. SCORE + 4. MODEL --------------------------- */}
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-[var(--text)]">
              {entry.buildName}
            </p>
            <p className="truncate text-[11px] text-[var(--text-secondary)]">
              {entry.modelName}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <ScoreReveal
              value={entry.total}
              decimals={2}
              className="block text-[20px] font-semibold leading-none text-[var(--text)]"
            />
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              of 100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1">
          {(
            [
              ["controls", entry.dims.controls],
              ["combat", entry.dims.combat],
              ["content", entry.dims.content],
              ["audio", entry.dims.audio],
              ["polish", entry.dims.polish],
            ] as const
          ).map(([key, pts], i) => (
            <div key={key} className="min-w-0">
              <div
                className="h-1 w-full overflow-hidden rounded-full bg-[var(--elevated)]"
                title={`${key}: ${pts}/20`}
              >
                <div
                  className={cn(
                    "h-full w-full rounded-full",
                    dimensionStatus(pts) === "pass" && "bg-[var(--accent)]",
                    dimensionStatus(pts) === "partial" && "bg-[var(--warning)]",
                    dimensionStatus(pts) === "fail" && "bg-[var(--danger)]",
                  )}
                  style={{
                    transform: `scaleX(${pts / 20})`,
                    transformOrigin: "left",
                    transition: `transform ${MOTION_EASE.out && 450}ms cubic-bezier(0.16,1,0.3,1) ${
                      250 + i * MOTION_STAGGER.dimension * 1000
                    }ms, opacity 200ms`,
                  }}
                />
              </div>
              <span className="mt-1 block truncate text-center font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">
                {key.slice(0, 4)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Link
            href={entry.playPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-[8px] bg-[var(--accent)] px-2.5 py-2 text-[12px] font-semibold text-[var(--accent-foreground)] transition-[filter] hover:brightness-110"
          >
            <Gamepad2 className="size-3.5" aria-hidden="true" />
            Play build
          </Link>
          <Link
            href={`/models/${entry.modelSlug}`}
            className="inline-flex items-center justify-center gap-1 rounded-[8px] border border-[var(--border)] px-2.5 py-2 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent-border)] hover:text-[var(--accent-ink)]"
          >
            Evidence
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-[var(--text-tertiary)]">
          <span>
            {entry.findings.length} finding{entry.findings.length === 1 ? "" : "s"}
            {highFailures > 0 ? ` · ${highFailures} failing` : ""}
          </span>
          <span>{entry.mobileReady ? "Touch ready" : "No touch support"}</span>
          {altEntry ? (
            <Link
              href={altEntry.playPath}
              className="ml-auto inline-flex items-center gap-1 underline-offset-2 hover:underline"
            >
              alt build {altEntry.total.toFixed(1)}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Grid of every audited artifact, ranked by score. */
export function ArtifactGrid({
  entries = AUDIT_TRAIL,
  altFor = { "deepseek-v4-1-flash": AUDIT_BY_BUILD["inferno-dead"] },
  className,
  columns = "sm:grid-cols-2 xl:grid-cols-3",
}: {
  entries?: AuditEntry[];
  altFor?: Record<string, AuditEntry | undefined>;
  className?: string;
  columns?: string;
}) {
  const ranked = React.useMemo(
    () => [...entries].sort((a, b) => b.total - a.total),
    [entries],
  );
  return (
    <div className={cn("grid gap-3", columns, className)}>
      {ranked.map((e, i) => (
        <ArtifactCard
          key={e.buildId}
          entry={e}
          altEntry={altFor[e.modelSlug]}
          index={i}
        />
      ))}
    </div>
  );
}
