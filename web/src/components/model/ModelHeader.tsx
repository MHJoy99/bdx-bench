"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, Gamepad2, Pause, Play } from "lucide-react";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Model } from "@/lib/types";
import type { AuditEntry } from "@/lib/audit-data";
import { scoreLabel } from "@/lib/scores";
import {
  FadeIn,
  LivePreviewShell,
  ScoreReveal,
  usePrefersReducedMotion,
} from "@/components/motion/polish-motion";
import { providerLabel } from "./Provenance";

/**
 * BDX Bench — model page hero, artifact first.
 *
 * Creative direction: "GitHub for AI-generated software artifacts." Hierarchy is
 * artifact -> evidence -> score -> model identity, so the order here is:
 *
 *   1. model identity, compact (mono id, name, provider/family/released, badges)
 *   2. the PLAYABLE BUILD — a large live window running the canonical audited
 *      build. The live canvas is the emotional hook of the whole site.
 *   3. the Showdown Score, two decimals, revealed once.
 *
 * Gating the live window (three conditions, all required):
 *   - the wrapper must have scrolled into view (IntersectionObserver), so a
 *     closed page above it costs zero frames;
 *   - `prefers-reduced-motion` must be off — under reduced motion nothing
 *     autoplays and the reader gets the static readout plus the Play link;
 *   - the reader has not pressed Stop.
 * `LivePreviewShell` additionally waits for the iframe's load event before
 * fading the canvas in, so an empty black box is never shown.
 *
 * The embedded canvas is `pointer-events-none` (that is the primitive's
 * contract) — it is a live preview, not a playable surface. "Play build" is
 * the control link, and the UI says so rather than implying otherwise.
 */

/** IntersectionObserver gate. Mirrors the artifact card's, tuned for the hero. */
function useInView<T extends HTMLElement>(threshold = 0.3) {
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
        setInView(hit ? hit.intersectionRatio >= threshold : false);
      },
      { threshold: [0, threshold, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

export interface ModelHeaderProps {
  model: Model;
  /** The canonical audited build for this model's published score. */
  entry?: AuditEntry;
  /** 1-based rank in the current round, when the caller can compute it. */
  rank?: number;
  /** Number of models in the current round, for the rank caption. */
  fieldSize?: number;
}

export function ModelHeader({ model, entry, rank, fieldSize }: ModelHeaderProps) {
  const caps = model.capabilities as unknown as Record<string, unknown>;
  const openWeights = (model as unknown as { openWeights?: unknown }).openWeights === true;

  // Only applicable capabilities render — absent ones are omitted, never shown
  // as present. Weights status always shows (open vs closed).
  const badges: { label: string; active: boolean }[] = [
    ...(caps["vision"] === true ? [{ label: "Vision", active: true }] : []),
    ...(caps["tools"] === true ? [{ label: "Tools", active: true }] : []),
    ...(caps["audio"] === true ? [{ label: "Audio", active: true }] : []),
    ...(caps["multimodal"] === true
      ? [{ label: "Multimodal", active: true }]
      : []),
    { label: openWeights ? "Open weights" : "Closed weights", active: openWeights },
  ];

  const score =
    typeof model.scores.overall === "number" && Number.isFinite(model.scores.overall)
      ? model.scores.overall
      : entry?.total ?? null;

  const [wrapRef, inView] = useInView<HTMLDivElement>(0.3);
  const [wantsLive, setWantsLive] = React.useState(true);
  const reduced = usePrefersReducedMotion();
  // `usePrefersReducedMotion` reports false on the very first render and reads
  // the media query in an effect. This flag flips in a later-registered effect
  // so the live window cannot mount on first paint — which is what actually
  // guarantees a reduced-motion user never gets an autoplaying build.
  const [motionKnown, setMotionKnown] = React.useState(false);
  React.useEffect(() => setMotionKnown(true), []);
  const showLive = wantsLive && motionKnown && inView && !reduced;

  const playPath = entry?.playPath;

  return (
    <header className="space-y-3">
      {/* 1. IDENTITY — compact, above the artifact ------------------------ */}
      <FadeIn>
        <div className="border-b border-[var(--border)] pb-3">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            {model.id}
            {rank != null && fieldSize != null ? (
              <span className="tnum"> · rank {rank} of {fieldSize}</span>
            ) : null}
          </p>

          <h1 className="mt-1.5 text-[26px] font-bold leading-[30px] tracking-tight text-[var(--text)] sm:text-[30px] sm:leading-[34px]">
            {model.name}
          </h1>

          <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[12px] leading-[17px] text-[var(--text-secondary)]">
            <div className="flex gap-1.5">
              <dt className="font-medium text-[var(--text)]">Provider</dt>
              <dd>{providerLabel(model.provider)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-[var(--text)]">Family</dt>
              <dd>{model.family}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-[var(--text)]">Released</dt>
              <dd>
                {model.released ? (
                  <time dateTime={model.released}>{formatDate(model.released)}</time>
                ) : (
                  "Release date not published"
                )}
              </dd>
            </div>
          </dl>

          <ul aria-label="Model capabilities" className="mt-2 flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <li key={b.label}>
                <span
                  className={cn(
                    "inline-flex items-center rounded-[6px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider",
                    b.active
                      ? "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent-ink)]"
                      : "border-[var(--border)] bg-[var(--elevated)] text-[var(--text-secondary)]",
                  )}
                >
                  {b.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </FadeIn>

      {/* 2. PLAYABLE BUILD — the hero of the page ------------------------- */}
      {entry ? (
        <div
          ref={wrapRef}
          className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]"
          style={{ contain: "layout paint" }}
        >
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[var(--border)] px-3 py-2">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <h2 className="truncate text-[14px] font-semibold text-[var(--text)]">
                {entry.buildName}
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
                {entry.buildId}
              </span>
            </div>
            <p className="flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              <span className="tnum">generated {entry.generated}</span>
              <span
                className={cn(
                  "rounded-[4px] border px-1.5 py-px",
                  entry.mobileReady
                    ? "border-[var(--accent-border)] text-[var(--accent-ink)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]",
                )}
              >
                {entry.mobileReady ? "Touch ready" : "No touch support"}
              </span>
            </p>
          </div>

          <div className="relative">
            {showLive ? (
              <LivePreviewShell
                open
                playPath={entry.playPath}
                title={`${entry.buildName} by ${entry.modelName}`}
                className="rounded-none border-x-0 border-t-0 border-b border-[var(--border)]"
              >
                <div className="flex aspect-video w-full items-center justify-center bg-[var(--elevated)]">
                  <Gamepad2 className="size-6 text-[var(--text-tertiary)]" aria-hidden="true" />
                </div>
              </LivePreviewShell>
            ) : (
              <Poster entry={entry} />
            )}

            {showLive ? (
              <button
                type="button"
                onClick={() => setWantsLive(false)}
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-[6px] border border-[var(--border)] bg-[var(--overlay)] px-1.5 py-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-secondary)] transition-colors hover:text-[var(--text)]"
              >
                <Pause className="size-3" aria-hidden="true" />
                Stop preview
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              {playPath ? (
                <>
                  {!showLive ? (
                    <button
                      type="button"
                      onClick={() => setWantsLive(true)}
                      disabled={reduced}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-[8px] border px-2.5 py-2 text-[12px] font-semibold transition-colors",
                        reduced
                          ? "cursor-not-allowed border-[var(--border)] text-[var(--text-tertiary)]"
                          : "border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent-ink)] hover:border-[var(--accent)]",
                      )}
                    >
                      <Play className="size-3.5" aria-hidden="true" />
                      {reduced ? "Autoplay off" : "Run in place"}
                    </button>
                  ) : null}
                  <Link
                    href={playPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-[8px] bg-[var(--accent)] px-3 py-2 text-[12px] font-semibold text-[var(--accent-foreground)] transition-[filter] hover:brightness-110"
                  >
                    <Gamepad2 className="size-3.5" aria-hidden="true" />
                    Play build
                    <ArrowUpRight className="size-3" aria-hidden="true" />
                  </Link>
                </>
              ) : null}
            </div>
            <p className="min-w-0 text-[11px] leading-[16px] text-[var(--text-tertiary)]">
              {showLive
                ? "Live canvas, running in place. Open the build to control it."
                : reduced
                  ? "Autoplay is off because your system asks for reduced motion. The build is one click away."
                  : "The live canvas starts when the window reaches your screen and stops when you scroll away."}
            </p>
          </div>
        </div>
      ) : null}

      {/* 3. SCORE — two decimals, revealed once -------------------------- */}
      <FadeIn delay={0.05}>
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 rounded-[10px] border border-[var(--border)] bg-[var(--elevated)] px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Showdown Score
            </p>
            <p className="mt-0.5 flex items-baseline gap-1.5">
              {score === null ? (
                <span className="text-[24px] font-semibold leading-[42px] text-[var(--text-tertiary)]">
                  Not evaluated
                </span>
              ) : (
                <ScoreReveal
                  value={score}
                  decimals={2}
                  className="tnum text-[40px] font-bold leading-[42px] text-[var(--text)]"
                />
              )}
              <span className="tnum text-[14px] text-[var(--text-tertiary)]">
                /100
              </span>
            </p>
          </div>
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            {score !== null ? (
              <span className="rounded-[4px] border border-[var(--accent-border)] bg-[var(--accent-muted)] px-1.5 py-px text-[var(--accent-ink)]">
                {scoreLabel(score)}
              </span>
            ) : null}
            <span>Showdown Score v2</span>
            <span aria-hidden="true">·</span>
            <span>strict source-code audit</span>
            {rank != null && fieldSize != null ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="tnum">#{rank} of {fieldSize}</span>
              </>
            ) : null}
          </p>
        </div>
      </FadeIn>
    </header>
  );
}

/**
 * Idle state of the live window: a factual readout of the build, not a fake
 * screenshot. Same aspect ratio as the mounted canvas, so nothing shifts when
 * the live window starts. Shown while the window is off screen, while the
 * reader pressed Stop, and whenever autoplay is suppressed.
 */
function Poster({ entry }: { entry: AuditEntry }) {
  return (
    <div className="flex aspect-video w-full items-center justify-center bg-[var(--elevated)] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-[10px] border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          <span className="truncate">{entry.buildId}</span>
          <span className="tnum shrink-0">{entry.generated}</span>
        </div>
        <p className="mt-2 text-[13px] leading-[19px] text-[var(--text-secondary)]">
          {entry.implements[0]}
        </p>
        <p className="mt-3 font-mono text-[10px] uppercase leading-[14px] tracking-wider text-[var(--text-tertiary)]">
          {entry.findings.length} verified finding
          {entry.findings.length === 1 ? "" : "s"} ·{" "}
          {entry.mobileReady ? "touch ready" : "no touch support"} ·{" "}
          {entry.dims && Object.keys(entry.dims).length === 5
            ? "5 audited dimensions"
            : "audited build"}
        </p>
      </div>
    </div>
  );
}
