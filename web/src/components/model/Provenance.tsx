import Link from "next/link";
import { ArrowUpRight, Gamepad2, ShieldCheck } from "lucide-react";
import { AuditFindings } from "@/components/artifact/artifact-card";
import {
  AUDIT_DIMENSIONS,
  AUDIT_TRAIL,
  SEVERITY_LABEL,
  SEVERITY_ORDER,
  type AuditDimensionKey,
  type AuditEntry,
  type AuditFinding,
} from "@/lib/audit-data";
import { getBenchmarkEvaluations, getSource } from "@/lib/data";
import type { Model } from "@/lib/types";
import {
  FadeIn,
  ScoreReveal,
  StaggerGroup,
  StaggerItem,
} from "@/components/motion/polish-motion";
import { MOTION_STAGGER } from "@/lib/motion-tokens";
import { AuditBars } from "./MetricsGrid";
import { cn } from "@/lib/utils";

/**
 * BDX Bench — the audit record, and the model page's shared data module.
 *
 * This file is the single source of truth for three things every model surface
 * needs, and it is deliberately free of "use client" so server pages can import
 * the helpers as real values (a "use client" export read from a server
 * component is a client reference proxy, not data):
 *
 * 1. Audit resolution. `AUDIT_BY_SLUG` in `audit-data.ts` is last-wins and is
 *    NOT safe: two models shipped two audited builds each (Space Bunny Free
 *    91 + 49 superseded, DeepSeek V4.1 Flash 80 + 61). Every lookup here
 *    matches the model's CANONICAL PUBLISHED SCORE against the trail, falling
 *    back to the strongest audited build only when no score exists.
 *    `AUDIT_BY_SLUG` is never read.
 *
 * 2. Per-dimension attribution. Findings carry no dimension key, so each is
 *    attributed to the dimension it actually cost points in
 *    (`FINDING_DIMENSION`), and each `implements` line is attributed to the
 *    first dimension its vocabulary matches (`DIMENSION_HINTS`). Both maps are
 *    presentation-only: no text is duplicated, every string rendered is the
 *    exact string from the audit entry, and anything they do not cover degrades
 *    to an honest "not recorded" line rather than disappearing.
 *
 * 3. The two report surfaces: the scientific-report build header (with a
 *    labelled secondary build when a model shipped two) and the failure
 *    ledger, which is never collapsed.
 */

const SHOWDOWN_SLUG = "zombie-flamethrower-showdown";
const SHOWDOWN_NAME = "Zombie Flamethrower Showdown";
const AUDIT_METHOD = "Showdown Score v2 · strict source-code audit";

/* ------------------------------------------------------------------ *
 * Provider labels
 * ------------------------------------------------------------------ */

export const PROVIDER_LABELS: Record<string, string> = {
  "bdx-ai": "BDX AI",
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  meta: "Meta",
  mistral: "Mistral",
  deepseek: "DeepSeek",
  qwen: "Qwen",
  xai: "xAI",
  opencode: "OpenCode",
  other: "BDX AI Gateway",
};

export function providerLabel(provider: string): string {
  return PROVIDER_LABELS[provider] ?? provider;
}

/* ------------------------------------------------------------------ *
 * Audit resolution — slug + canonical score, never slug alone
 * ------------------------------------------------------------------ */

/** Every audited build a model shipped, highest score first. */
const AUDIT_TRAIL_SORTED: AuditEntry[] = [...AUDIT_TRAIL].sort(
  (a, b) => b.total - a.total,
);

export function auditEntriesFor(slug: string): AuditEntry[] {
  return AUDIT_TRAIL_SORTED.filter((e) => e.modelSlug === slug);
}

/**
 * The audited build behind a model's published Showdown Score.
 * Matches slug AND score; falls back to the strongest audited build.
 */
export function auditEntryFor(
  slug: string,
  score?: number | null,
): AuditEntry | undefined {
  const list = auditEntriesFor(slug);
  const first = list[0];
  if (!first) return undefined;
  if (typeof score === "number" && Number.isFinite(score)) {
    const exact = list.find((e) => e.total === score);
    if (exact) return exact;
  }
  return first;
}

/** Every other audited build a model shipped (the secondary artifact). */
export function altEntryFor(
  slug: string,
  score?: number | null,
): AuditEntry | undefined {
  const primary = auditEntryFor(slug, score);
  return auditEntriesFor(slug).find((e) => e.buildId !== primary?.buildId);
}

/** Canonical published Showdown Score for a model record, or null. */
export function scoreOf(model: Model): number | null {
  const v = model.scores.overall;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** How a secondary build is labelled on its own card. */
const ALT_BUILD_LABEL: Record<string, string> = {
  "space-bunny": "Superseded build",
  "inferno-dead": "Second audited build",
};

export function altBuildLabel(entry: AuditEntry): string {
  return ALT_BUILD_LABEL[entry.buildId] ?? "Second audited build";
}

/* ------------------------------------------------------------------ *
 * Per-dimension evidence
 * ------------------------------------------------------------------ */

export type DimensionStatus = "pass" | "partial" | "fail";

export const DIMENSION_MAX = 20;

export const STATUS_LABEL: Record<DimensionStatus, string> = {
  pass: "Pass",
  partial: "Partial pass",
  fail: "Failure",
};

export const STATUS_TONE: Record<DimensionStatus, string> = {
  pass: "text-[var(--accent-ink)]",
  partial: "text-[var(--warning)]",
  fail: "text-[var(--danger)]",
};

export const SEVERITY_TONE: Record<AuditFinding["severity"], string> = {
  high: "text-[var(--danger)]",
  medium: "text-[var(--warning)]",
  low: "text-[var(--text-tertiary)]",
};

/**
 * Vocabulary each dimension is matched on, in priority order. An
 * `implements` line is attributed to the FIRST dimension it matches, so the
 * five evidence lines of a build never duplicate each other.
 */
const DIMENSION_HINTS: ReadonlyArray<{
  key: AuditDimensionKey;
  re: RegExp;
}> = [
  {
    key: "controls",
    re: /\b(touch|pointer|stick|controls?|keyboard|keys|wasd|w\/a\/s\/d|movement|input|autofire)\b/i,
  },
  {
    key: "polish",
    re: /\b(slow-motion|slow motion|hit-stop|hitstop|screen shake|shake|combo|feedback|post-process|post processing|lighting|scanline|parallax|game feel|radar|minimap|recoil|localstorage|local storage|persist)\b/i,
  },
  {
    key: "combat",
    re: /\b(knockback|damage|weapon|flamethrower|flame|fire|burn|ignite|contagion|cone|dash|i-frame|iframes|hit|explosion|explosions|mass|projectile|bullet)\b/i,
  },
  {
    key: "content",
    re: /\b(enemy types|enemy classes|enemy variety|enemy count|archetype|archetypes|varieties|classes|boss|bosses|wave|waves|upgrade|upgrades|card|cards|draft|pickup|pickups|progression)\b/i,
  },
  {
    key: "audio",
    re: /\b(audio|sfx|sound|sounds|music|sequencer|noise|beep|blip|synth|oscillator|webaudio|web audio|mute|roar|tempo)\b/i,
  },
];

/**
 * Which dimension each verified finding cost points in. Keyed by build id then
 * by the exact finding title, so a title change surfaces as an unassigned
 * finding (rendered, never dropped) rather than a silent mis-grouping.
 */
const FINDING_DIMENSION: Record<string, Record<string, AuditDimensionKey>> = {
  "ember-dead": {
    "No roguelite upgrade layer": "content",
    "Inverted knockback mass table": "combat",
    "Inferno nuke audio is O(n2)": "audio",
  },
  "pyre-burn-horde": {
    "Zero touch support": "controls",
    "Hard softlock after the wave-20 draft": "content",
    "Runner and Brute are stat sticks": "content",
    "Titan boss has one ability": "combat",
  },
  "firebreak-night-shift": {
    "Reachable pause hang": "polish",
    "Ultimate unreachable on touch": "controls",
    "No boss, no music": "audio",
    "Scorch decals do nothing": "polish",
  },
  cinderline: {
    "Knockback entirely absent": "combat",
    "Hit flash saturates to solid white": "polish",
    "Touch input lockout after restart": "controls",
    "No boss, no upgrades, no music": "content",
  },
  "inferno-dead": {
    "All four enemy types share one AI": "content",
    "Boss has zero abilities": "combat",
    "No music": "audio",
    "No resize handler": "polish",
  },
  "pyro-vs-zombies": {
    "touchcancel leaves the flamethrower latched": "controls",
    "One finger can never fire or aim": "controls",
    "Pausing mid-burst leaves the roar droning": "audio",
    "No boss, no combo, no upgrades": "content",
  },
  emberfall: {
    "One enemy archetype": "content",
    "No additive compositing at all": "polish",
    "Flame keeps animating while paused": "polish",
    "No boss, no combo, no music": "content",
  },
  "pyroclasm-inferno": {
    "Advertised dash does not exist": "controls",
    "No delta time anywhere": "polish",
    "1.9M-op/frame cliff": "polish",
    "AoE constants understate damage 8.1x": "combat",
    "Zero touch handlers, zero mobile media query": "controls",
  },
  "space-bunny": {
    "No flamethrower implementation": "combat",
    "The card draft was a CSS HUD": "content",
    "Mobile media query with zero touch handlers": "controls",
    "Audio is 15 one-shot blips": "audio",
  },
  "zombie-fire-survival": {
    "Absolute zero audio": "audio",
    "A flamethrower game with no fuel economy": "combat",
    "The burn DoT can never kill": "combat",
    "One enemy, zero progression": "content",
    "The score label contradicts its own value": "polish",
  },
};

/** The dimension a finding was logged against, or null when unmapped. */
export function dimensionOfFinding(
  entry: AuditEntry,
  finding: AuditFinding,
): AuditDimensionKey | null {
  return FINDING_DIMENSION[entry.buildId]?.[finding.title] ?? null;
}

/** Findings grouped under a dimension, worst severity first. */
export function findingsForDimension(
  entry: AuditEntry,
  key: AuditDimensionKey,
): AuditFinding[] {
  return entry.findings
    .filter((f) => dimensionOfFinding(entry, f) === key)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/** Every finding, worst severity first, ties broken alphabetically. */
export function findingsWorstFirst(entry: AuditEntry): AuditFinding[] {
  return [...entry.findings].sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    return s !== 0 ? s : a.title.localeCompare(b.title);
  });
}

/** Findings the maps could not attribute to any dimension (never hidden). */
export function unassignedFindings(entry: AuditEntry): AuditFinding[] {
  return findingsWorstFirst(entry).filter(
    (f) => dimensionOfFinding(entry, f) === null,
  );
}

/**
 * The verified `implements` line that evidences each dimension. A line belongs
 * to exactly one dimension, so five dimensions never show the same sentence.
 */
export function dimensionLines(
  entry: AuditEntry,
): Partial<Record<AuditDimensionKey, string>> {
  const out: Partial<Record<AuditDimensionKey, string>> = {};
  for (const line of entry.implements) {
    for (const hint of DIMENSION_HINTS) {
      if (out[hint.key] !== undefined) continue;
      if (hint.re.test(line)) {
        out[hint.key] = line;
        break;
      }
    }
  }
  return out;
}

function severityCount(findings: AuditFinding[], severity: AuditFinding["severity"]) {
  return findings.filter((f) => f.severity === severity).length;
}

/* ------------------------------------------------------------------ *
 * BUILD REPORT HEADER + secondary build
 * ------------------------------------------------------------------ */

export interface ProvenanceProps {
  entry?: AuditEntry;
  altEntry?: AuditEntry;
  modelSlug?: string;
  modelName?: string;
}

export function Provenance({
  entry,
  altEntry,
  modelSlug,
  modelName,
}: ProvenanceProps) {
  const evaluatedAt = entry?.generated ?? "2026-09-12";
  const source = getSource("local-manual-eval");
  const stored = modelSlug
    ? getBenchmarkEvaluations(SHOWDOWN_SLUG).find((e) => e.modelSlug === modelSlug)
    : undefined;

  if (!entry) {
    return (
      <section aria-labelledby="model-provenance-heading">
        <h2
          id="model-provenance-heading"
          className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
        >
          Build report
        </h2>
        <p className="mt-2 rounded-[10px] border border-dashed border-[var(--border-strong)] p-5 text-[13px] text-[var(--text-secondary)]">
          No audited build exists for this model, so there is no report header,
          no dimension breakdown, and no failure list. Nothing is estimated.
        </p>
      </section>
    );
  }

  const findings = entry.findings.length;
  const failing = severityCount(entry.findings, "high");

  const items: { label: string; value: string }[] = [
    { label: "Generated", value: evaluatedAt },
    { label: "Audit method", value: AUDIT_METHOD },
    { label: "Dimensions", value: `${AUDIT_DIMENSIONS.length} × 20 pts` },
    {
      label: "Verified findings",
      value: failing > 0 ? `${findings} · ${failing} failing` : `${findings}`,
    },
    { label: "Build id", value: entry.buildId },
    { label: "Evaluator", value: source?.id ?? "local-manual-eval" },
  ];

  return (
    <section
      aria-labelledby="model-provenance-heading"
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
        <div className="min-w-0">
          <h2
            id="model-provenance-heading"
            className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
          >
            Build report
          </h2>
          <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
            The record this page&apos;s number is drawn from: one audited build,
            one score, and the provenance of both.
          </p>
        </div>
        <p className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
          <ShieldCheck className="size-3" aria-hidden="true" />
          Implementation-level audit
        </p>
      </div>

      <FadeIn>
        <div className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-b border-[var(--border)] bg-[var(--elevated)] px-3 py-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Build report · {entry.buildName}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              {modelName ? `${modelName} · ` : ""}
              {stored
                ? `evaluated ${stored.evaluatedAt}`
                : `evaluated ${evaluatedAt}`}
            </span>
          </div>
          <dl className="grid grid-cols-2 gap-px bg-[var(--border)] sm:grid-cols-3 lg:grid-cols-6">
            {items.map((item) => (
              <div
                key={item.label}
                className="min-w-0 bg-[var(--surface)] px-3 py-2"
              >
                <dt className="font-mono text-[9px] uppercase leading-[12px] tracking-wider text-[var(--text-tertiary)]">
                  {item.label}
                </dt>
                <dd className="tnum mt-0.5 font-mono text-[11px] leading-[15px] text-[var(--text)]">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </FadeIn>

      <p className="text-[12px] leading-[17px] text-[var(--text-secondary)]">
        Suite: <span className="text-[var(--text)]">{SHOWDOWN_NAME}</span> ·
        round September 2026 · one manual run per model, so intervals are
        zero-width. Scoring rules, the withdrawn v1 method, and the limits of
        this round are in{" "}
        <Link
          href="/methodology"
          className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-[var(--text)]"
        >
          Methodology
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
        .
      </p>

      {altEntry ? (
        <SecondaryBuild entry={altEntry} primary={entry} />
      ) : null}
    </section>
  );
}

/**
 * A model's second audited build. Shown as its own artifact, explicitly
 * labelled — Space Bunny Free's older build is superseded, DeepSeek's second
 * build is not the scored entry — with its own score and its own findings.
 */
function SecondaryBuild({
  entry,
  primary,
}: {
  entry: AuditEntry;
  primary: AuditEntry;
}) {
  return (
    <div className="rounded-[10px] border border-[var(--border)] bg-[var(--elevated)] p-3">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            {altBuildLabel(entry)}
          </p>
          <p className="mt-0.5 truncate text-[13px] font-semibold text-[var(--text)]">
            {entry.buildName}
          </p>
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            {entry.buildId} · generated {entry.generated} ·{" "}
            {entry.findings.length} finding
            {entry.findings.length === 1 ? "" : "s"}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="tnum block text-[20px] font-semibold leading-none text-[var(--text)]">
            <ScoreReveal value={entry.total} decimals={2} />
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
            of 100
          </span>
        </p>
      </div>

      <p className="mt-2 text-[12px] leading-[17px] text-[var(--text-secondary)]">
        {entry.modelName} shipped two audited builds. The page score of{" "}
        <span className="tnum text-[var(--text)]">{primary.total.toFixed(2)}</span>{" "}
        belongs to <span className="font-mono">{primary.buildId}</span>; this one
        scored <span className="tnum">{entry.total.toFixed(2)}</span> under the
        same v2 audit and is reported here rather than dropped.
      </p>

      <AuditBars dims={entry.dims} className="mt-2.5" />

      <p className="mt-2.5 text-[12px] leading-[17px] text-[var(--text-secondary)]">
        {entry.implements[0]}
      </p>

      <div className="mt-2.5">
        <AuditFindings findings={entry.findings} />
      </div>

      <div className="mt-2.5">
        <Link
          href={entry.playPath}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-[12px] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
        >
          <Gamepad2 className="size-3.5" aria-hidden="true" />
          Play {entry.buildName}
          <ArrowUpRight className="size-3" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FAILURES FOUND — the trust engine
 * ------------------------------------------------------------------ */

export function FailuresFound({ entry }: { entry?: AuditEntry }) {
  if (!entry || entry.findings.length === 0) return null;

  const sorted = findingsWorstFirst(entry);
  const failing = severityCount(entry.findings, "high");
  const gap = Math.min(
    MOTION_STAGGER.card,
    MOTION_STAGGER.maxTotal / Math.max(1, sorted.length - 1),
  );

  return (
    <section
      aria-labelledby="model-failures-heading"
      className="space-y-3"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1 border-b border-[var(--border)] pb-2">
        <div className="min-w-0">
          <h2
            id="model-failures-heading"
            className="text-[15px] font-semibold tracking-tight text-[var(--text)]"
          >
            Failures found
          </h2>
          <p className="mt-0.5 text-[12px] leading-[18px] text-[var(--text-secondary)]">
            Most benchmarks hide failures. These {entry.buildName} defects were
            observed in the source and in play, worst first, and each one is why
            the score above is not higher.
          </p>
        </div>
        <p className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider">
          <span className="tnum text-[var(--danger)]">{failing} failing</span>
          <span aria-hidden="true" className="text-[var(--text-tertiary)]">
            ·
          </span>
          <span className="tnum text-[var(--warning)]">
            {severityCount(entry.findings, "medium")} partial pass
          </span>
          <span aria-hidden="true" className="text-[var(--text-tertiary)]">
            ·
          </span>
          <span className="tnum text-[var(--text-tertiary)]">
            {severityCount(entry.findings, "low")} known issue
          </span>
        </p>
      </div>

      {/* Never collapsed: a benchmark that hides its own defects is not worth
          reading. Worst severity first, always open. */}
      <StaggerGroup gap={gap}>
        <ol className="overflow-hidden rounded-[10px] border border-[var(--border)] bg-[var(--surface)]">
          {sorted.map((f) => {
            const dim = dimensionOfFinding(entry, f);
            const dimension = AUDIT_DIMENSIONS.find((d) => d.key === dim);
            return (
              <StaggerItem
                key={f.title}
                y={4}
                className="border-b border-[var(--border)] px-3 py-2.5 last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <p className="min-w-0 text-[13px] font-medium leading-[18px] text-[var(--text)]">
                    {f.title}
                  </p>
                  <p
                    className={cn(
                      "shrink-0 font-mono text-[10px] uppercase tracking-wider",
                      SEVERITY_TONE[f.severity],
                    )}
                  >
                    {SEVERITY_LABEL[f.severity]}
                  </p>
                </div>
                <p className="mt-0.5 text-[12px] leading-[17px] text-[var(--text-secondary)]">
                  {f.impact}
                </p>
                {dimension ? (
                  <p className="mt-1 font-mono text-[10px] uppercase leading-[14px] tracking-wider text-[var(--text-tertiary)]">
                    Dimension costed · {dimension.short}
                  </p>
                ) : null}
              </StaggerItem>
            );
          })}
        </ol>
      </StaggerGroup>

      <p className="text-[11px] leading-[16px] text-[var(--text-tertiary)]">
        Severity follows the audit contract: failure = the build cannot do the
        thing it advertises · partial pass = implemented but wrong · known issue
        = cosmetic or unreachable. A feature that only appears in a comment, an
        on-screen string, or unreachable code is not credited anywhere on this
        page.
      </p>
    </section>
  );
}
