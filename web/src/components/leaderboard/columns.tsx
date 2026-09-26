import Link from "next/link";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import { ArrowUpRight, ChevronRight, Play } from "lucide-react";
import type { Model } from "@/lib/types";
import {
  AUDIT_DIMENSIONS,
  AUDIT_TRAIL,
  type AuditDimensionKey,
  type AuditEntry,
} from "@/lib/audit-data";
import { DimensionBar, ScoreReveal } from "@/components/motion/polish-motion";
import {
  formatDate,
  formatPrice,
  formatScore,
  formatTokens,
  formatTps,
} from "@/lib/format";

/**
 * LEADERBOARD SLICE — column contract.
 *
 * Creative direction (GPT Orchestrator, Senior Creative Director):
 * this is an EVIDENCE TABLE, not a scoreboard. Every number a row shows is
 * traceable to a verified build, so the columns carry evidence next to the
 * score: the five audited dimensions, the verified defect count, and a link
 * into the artifact itself. Hierarchy stays artifact -> evidence -> score ->
 * model identity.
 *
 * No logos, no medals, no trophies: rank is a plain number because the rank is
 * a consequence of the evidence, not a prize.
 */

export type LeaderboardTableRow = Model & {
  rank: number;
  rankDelta?: number | null;
};

/** Scale caption for the score column header. Precision creates trust. */
export const SCORE_SCALE_CAPTION =
  "Showdown Score v2 · 5 dimensions x 20 pts · zero for absent features";

/** The audit round this board reports. Static data: one round, dated. */
export const AUDIT_ROUND_LABEL = "Audit round 2026-09-26";

export const LEADERBOARD_COLUMN_ORDER = [
  "rank",
  "model",
  "provider",
  "overall",
  "evidence",
  "dimControls",
  "dimCombat",
  "dimContent",
  "dimAudio",
  "dimPolish",
  "reasoning",
  "coding",
  "math",
  "knowledge",
  "vision",
  "agentic",
  "speed",
  "inputPrice",
  "outputPrice",
  "context",
  "released",
] as const;

export type LeaderboardColumnId =
  (typeof LEADERBOARD_COLUMN_ORDER)[number];

/** Column id per audit dimension, so a dimension can be sorted like any column. */
export const DIMENSION_COLUMN_IDS = {
  controls: "dimControls",
  combat: "dimCombat",
  content: "dimContent",
  audio: "dimAudio",
  polish: "dimPolish",
} as const satisfies Record<AuditDimensionKey, string>;

/** Column id -> the audit dimension it reports. */
export const COLUMN_DIMENSION: Record<string, AuditDimensionKey> = {
  dimControls: "controls",
  dimCombat: "combat",
  dimContent: "content",
  dimAudio: "audio",
  dimPolish: "polish",
};

export const LEADERBOARD_COLUMN_LABELS: Record<string, string> = {
  rank: "Rank",
  model: "Model / build",
  provider: "Provider",
  overall: "Showdown Score",
  evidence: "Evidence",
  dimControls: "Controls",
  dimCombat: "Combat",
  dimContent: "Content",
  dimAudio: "Audio",
  dimPolish: "Polish",
  reasoning: "Reasoning",
  coding: "Coding",
  math: "Math",
  knowledge: "Knowledge",
  vision: "Vision",
  agentic: "Agentic",
  speed: "Speed",
  inputPrice: "Input Price",
  outputPrice: "Output Price",
  context: "Context",
  released: "Released",
};

/** Columns that are never toggled off (the evidence spine of the table). */
export const LOCKED_COLUMN_IDS = ["rank", "model", "provider", "overall", "evidence"] as const;

export const CATEGORY_SORT_KEY: Record<string, LeaderboardColumnId> = {
  overall: "overall",
  reasoning: "reasoning",
  coding: "coding",
  math: "math",
  knowledge: "knowledge",
  vision: "vision",
  agentic: "agentic",
  speed: "speed",
};

/**
 * Category tabs. `overall` is the only tab backed by measured data in the
 * current round; the rest are retained because the shared URL contract
 * validates them, and the toolbar says plainly that they are Not evaluated.
 */
export const CATEGORY_TABS = [
  { id: "overall", label: "Showdown" },
  { id: "reasoning", label: "Reasoning" },
  { id: "coding", label: "Coding" },
  { id: "math", label: "Math" },
  { id: "knowledge", label: "Knowledge" },
  { id: "vision", label: "Vision" },
  { id: "agentic", label: "Agentic" },
  { id: "speed", label: "Speed" },
] as const;

export type CategoryId = (typeof CATEGORY_TABS)[number]["id"];

/* ------------------------------------------------------------------ *
 * Audit wiring
 * ------------------------------------------------------------------ */

/** Canonical Showdown Score for a row (null = not measured, never a guess). */
export function showdownScore(row: LeaderboardTableRow): number | null {
  const v = row.scores.overall;
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * Resolve the audit entry for a model slug.
 *
 * `AUDIT_BY_SLUG` keeps only the LAST entry per slug, and two models shipped
 * two builds each (Space Bunny Free 91 / 49 superseded, DeepSeek V4.1 Flash
 * 80 / 61). Reading it directly would show the wrong build and the wrong
 * evidence, so resolve against the published score when one exists and fall
 * back to the model's strongest audited build.
 */
export function auditEntryFor(
  slug: string,
  score?: number | null,
): AuditEntry | undefined {
  const list = AUDIT_TRAIL.filter((e) => e.modelSlug === slug);
  const first = list[0];
  if (!first) return undefined;
  if (typeof score === "number" && Number.isFinite(score)) {
    const exact = list.find((e) => e.total === score);
    if (exact) return exact;
  }
  return list.reduce((best, e) => (e.total > best.total ? e : best), first);
}

/** Every audited build a model shipped, excluding the resolved one. */
export function altEntryFor(
  slug: string,
  score?: number | null,
): AuditEntry | undefined {
  const primary = auditEntryFor(slug, score);
  return AUDIT_TRAIL.find(
    (e) => e.modelSlug === slug && e.buildId !== primary?.buildId,
  );
}

/** Dimension points for a row, or null when the model was never audited. */
export function dimPointsFor(
  slug: string,
  key: AuditDimensionKey,
  score?: number | null,
): number | null {
  return auditEntryFor(slug, score)?.dims[key] ?? null;
}

export interface FindingCounts {
  total: number;
  failing: number;
}

export function findingCountsFor(
  slug: string,
  score?: number | null,
): FindingCounts | null {
  const entry = auditEntryFor(slug, score);
  if (!entry) return null;
  return {
    total: entry.findings.length,
    failing: entry.findings.filter((f) => f.severity === "high").length,
  };
}

function scoreTone(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v))
    return "text-[var(--text-tertiary)]";
  if (v >= 85) return "text-[var(--success)] font-medium";
  if (v >= 70) return "text-[var(--text)] font-medium";
  if (v >= 50) return "text-[var(--text-secondary)]";
  return "text-[var(--text-tertiary)]";
}

function scoreText(v: unknown): string {
  return typeof v === "number" && Number.isFinite(v)
    ? formatScore(v)
    : "Not evaluated";
}

const chipClass =
  "inline-flex items-center gap-1 rounded-[6px] border px-1.5 py-1 font-mono text-[10px] uppercase leading-none tracking-wider";

const linkClass =
  "inline-flex items-center gap-1 rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-1.5 py-1 text-[10px] leading-none text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]";

/* ------------------------------------------------------------------ *
 * Column defs
 * ------------------------------------------------------------------ */

export interface LeaderboardColumnOptions {
  /** Slugs whose audit trail row is expanded. */
  expanded?: ReadonlySet<string>;
  onToggleExpand?: (slug: string) => void;
  /** Slugs queued for the compare surface. */
  compareSelection?: readonly string[];
  onToggleCompare?: (slug: string) => void;
}

export function getLeaderboardColumns(
  opts: LeaderboardColumnOptions = {},
): LegacyColumnDef<
  LeaderboardTableRow,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] {
  const { expanded, onToggleExpand, compareSelection, onToggleCompare } = opts;
  const num = (
    a: LeaderboardTableRow,
    b: LeaderboardTableRow,
    get: (r: LeaderboardTableRow) => number,
  ) => get(a) - get(b);
  const finite = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) ? v : -Infinity;

  return [
    {
      id: "rank",
      header: "Rank",
      accessorFn: (row) => row.rank,
      cell: ({ row }) => {
        const rank = row.original.rank ?? 0;
        const delta = row.original.rankDelta ?? null;
        return (
          <span className="inline-flex items-center gap-1.5 font-mono tnum">
            <span
              className="tnum text-[12px] font-semibold text-[var(--text)]"
              aria-label={`Rank ${rank}`}
            >
              {String(rank).padStart(2, "0")}
            </span>
            {typeof delta === "number" && delta !== 0 ? (
              <span
                aria-label={delta > 0 ? `Up ${delta}` : `Down ${Math.abs(delta)}`}
                className={
                  delta > 0
                    ? "text-[11px] font-semibold text-[var(--accent-ink)]"
                    : "text-[11px] font-semibold text-[var(--danger)]"
                }
              >
                {delta > 0 ? `▲${delta}` : `▼${Math.abs(delta)}`}
              </span>
            ) : null}
          </span>
        );
      },
      sortFn: (a, b) =>
        (a.original.rank ?? Infinity) - (b.original.rank ?? Infinity),
      size: 72,
    },
    {
      id: "model",
      header: "Model / build",
      accessorKey: "name",
      cell: ({ row }) => {
        const r = row.original;
        const entry = auditEntryFor(r.slug, showdownScore(r));
        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="flex min-w-0 items-center gap-1.5">
              <Link
                data-testid="model-link"
                href={`/models/${r.slug}`}
                className="truncate font-medium text-[var(--text)] underline-offset-4 transition-colors hover:text-[var(--accent-ink)] hover:underline"
                title={r.name}
              >
                {r.name}
              </Link>
              <span className="shrink-0 rounded bg-[var(--elevated)] px-1 py-px font-mono text-[9px] uppercase tracking-wider leading-none text-[var(--text-secondary)]">
                {r.openWeights ? "open-weights" : "proprietary"}
              </span>
            </span>
            <span
              className="truncate font-mono text-[10px] text-[var(--text-tertiary)]"
              title={entry ? `${entry.buildId} · ${entry.buildName}` : r.slug}
            >
              {entry ? `${entry.buildId} · ${entry.buildName}` : r.slug}
            </span>
          </div>
        );
      },
      size: 240,
    },
    {
      id: "provider",
      header: "Provider",
      accessorKey: "provider",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-[12px] capitalize text-[var(--text-secondary)]">
          {String((getValue() as string | null | undefined) ?? "—")}
        </span>
      ),
      size: 130,
    },
    {
      id: "overall",
      header: "Showdown Score",
      accessorFn: (row) => row.scores.overall,
      cell: ({ row }) => {
        const v = showdownScore(row.original);
        return (
          <span className="flex flex-col">
            <span className="flex items-baseline gap-1">
              <ScoreReveal
                value={v ?? 0}
                decimals={2}
                className={`text-[15px] font-semibold leading-none ${scoreTone(v)}`}
              />
              <span className="tnum font-mono text-[10px] text-[var(--text-tertiary)]">
                /100
              </span>
            </span>
            <span className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Showdown v2
            </span>
          </span>
        );
      },
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.scores.overall)),
      size: 104,
    },
    {
      id: "evidence",
      header: "Evidence",
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        const score = showdownScore(r);
        const entry = auditEntryFor(r.slug, score);
        const counts = findingCountsFor(r.slug, score);
        const isOpen = expanded?.has(r.slug) ?? false;
        return (
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-1">
              {entry && counts ? (
                <button
                  type="button"
                  onClick={() => onToggleExpand?.(r.slug)}
                  aria-expanded={isOpen}
                  title="View evaluation — verified findings and per-dimension evidence"
                  data-testid={`evidence-toggle-${r.slug}`}
                  className={`${chipClass} border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]`}
                >
                  <ChevronRight
                    className={`size-3 transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}
                    aria-hidden="true"
                  />
                  {counts.total} findings
                </button>
              ) : (
                <span className={`${chipClass} border-dashed border-[var(--border-strong)] text-[var(--text-tertiary)]`}>
                  Not audited
                </span>
              )}
              {counts ? (
                counts.failing > 0 ? (
                  <span
                    className={`${chipClass} border-[var(--danger)]/40 bg-[var(--danger-muted)] text-[var(--danger)]`}
                    title="Findings verified as failures"
                  >
                    {counts.failing} failing
                  </span>
                ) : (
                  <span
                    className={`${chipClass} border-[var(--accent-border)] bg-[var(--accent-muted)] text-[var(--accent-ink)]`}
                    title="No verified failure findings in this build"
                  >
                    0 failing
                  </span>
                )
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1">
              {entry ? (
                <Link
                  href={entry.playPath}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`play-${r.slug}`}
                  title={`Play ${entry.buildName} (${entry.playPath})`}
                  className={`${linkClass} border-[var(--accent-border)] text-[var(--accent-ink)]`}
                >
                  <Play className="size-3" aria-hidden="true" />
                  Play
                </Link>
              ) : null}
              <Link
                href={`/models/${r.slug}`}
                title="Full evidence page for this model"
                className={linkClass}
              >
                Evidence
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </Link>
              {onToggleCompare ? (
                <label
                  className={`${linkClass} cursor-pointer select-none`}
                  title="Queue this model for the compare surface"
                >
                  <input
                    type="checkbox"
                    data-testid="compare-add"
                    checked={compareSelection?.includes(r.slug) ?? false}
                    onChange={() => onToggleCompare(r.slug)}
                    className="size-3 accent-[var(--accent)]"
                  />
                  <span className="sr-only">Add {r.name} to compare</span>
                  <span aria-hidden="true">cmp</span>
                </label>
              ) : null}
            </div>
          </div>
        );
      },
      size: 240,
    },
    ...AUDIT_DIMENSIONS.map((dim) => ({
      id: DIMENSION_COLUMN_IDS[dim.key],
      header: dim.short,
      accessorFn: (row: LeaderboardTableRow) =>
        dimPointsFor(row.slug, dim.key, showdownScore(row)),
      cell: ({ row }: { row: { original: LeaderboardTableRow } }) => {
        const pts = dimPointsFor(row.original.slug, dim.key, showdownScore(row.original));
        if (pts === null) {
          return (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-tertiary)]">
              Not audited
            </span>
          );
        }
        return (
          <div className="flex flex-col gap-1">
            <span className="tnum text-[12px] leading-none text-[var(--text)]">
              {pts}
              <span className="font-mono text-[10px] text-[var(--text-tertiary)]">/20</span>
            </span>
            <DimensionBar dimension={dim} points={pts} index={0} showLabel={false} />
          </div>
        );
      },
      sortFn: (
        a: { original: LeaderboardTableRow },
        b: { original: LeaderboardTableRow },
      ) =>
        num(a.original, b.original, (r) =>
          finite(dimPointsFor(r.slug, dim.key, showdownScore(r))),
        ),
      size: 72,
    })),
    {
      id: "reasoning",
      header: "Reasoning",
      accessorFn: (row) => row.scores.reasoning,
      cell: ({ row }) => (
        <span className={`tnum whitespace-nowrap text-[13px] ${scoreTone(row.original.scores.reasoning)}`}>
          {scoreText(row.original.scores.reasoning)}
        </span>
      ),
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.scores.reasoning)),
      size: 96,
    },
    {
      id: "coding",
      header: "Coding",
      accessorFn: (row) => row.scores.coding,
      cell: ({ row }) => (
        <span className={`tnum whitespace-nowrap text-[13px] ${scoreTone(row.original.scores.coding)}`}>
          {scoreText(row.original.scores.coding)}
        </span>
      ),
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.scores.coding)),
      size: 84,
    },
    {
      id: "math",
      header: "Math",
      accessorFn: (row) => row.scores.math,
      cell: ({ row }) => (
        <span className={`tnum whitespace-nowrap text-[13px] ${scoreTone(row.original.scores.math)}`}>
          {scoreText(row.original.scores.math)}
        </span>
      ),
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.scores.math)),
      size: 84,
    },
    {
      id: "knowledge",
      header: "Knowledge",
      accessorFn: (row) => row.scores.knowledge,
      cell: ({ row }) => (
        <span className={`tnum whitespace-nowrap text-[13px] ${scoreTone(row.original.scores.knowledge)}`}>
          {scoreText(row.original.scores.knowledge)}
        </span>
      ),
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.scores.knowledge)),
      size: 96,
    },
    {
      id: "vision",
      header: "Vision",
      accessorFn: (row) => row.scores.vision,
      cell: ({ row }) => (
        <span className={`tnum whitespace-nowrap text-[13px] ${scoreTone(row.original.scores.vision)}`}>
          {scoreText(row.original.scores.vision)}
        </span>
      ),
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.scores.vision)),
      size: 84,
    },
    {
      id: "agentic",
      header: "Agentic",
      accessorFn: (row) => row.scores.agentic,
      cell: ({ row }) => (
        <span className={`tnum whitespace-nowrap text-[13px] ${scoreTone(row.original.scores.agentic)}`}>
          {scoreText(row.original.scores.agentic)}
        </span>
      ),
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.scores.agentic)),
      size: 84,
    },
    {
      id: "speed",
      header: "Speed",
      accessorFn: (row) => row.speed?.tps ?? null,
      cell: ({ row }) => (
        <span className="tnum whitespace-nowrap text-[13px] text-[var(--text-secondary)]">
          {row.original.speed && Number.isFinite(row.original.speed.tps)
            ? formatTps(row.original.speed.tps)
            : "Not measured"}
        </span>
      ),
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.speed?.tps)),
      size: 110,
    },
    {
      id: "inputPrice",
      header: "Input Price",
      accessorFn: (row) => row.prices.inputPer1M,
      cell: ({ row }) => {
        const v = row.original.prices.inputPer1M as unknown;
        return (
          <span className="tnum whitespace-nowrap text-[13px] text-[var(--text-secondary)]">
            {typeof v === "number" && Number.isFinite(v)
              ? formatPrice(v, row.original.prices.currency)
              : "Not measured"}
          </span>
        );
      },
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.prices.inputPer1M)),
      size: 110,
    },
    {
      id: "outputPrice",
      header: "Output Price",
      accessorFn: (row) => row.prices.outputPer1M,
      cell: ({ row }) => {
        const v = row.original.prices.outputPer1M as unknown;
        return (
          <span className="tnum whitespace-nowrap text-[13px] text-[var(--text-secondary)]">
            {typeof v === "number" && Number.isFinite(v)
              ? formatPrice(v, row.original.prices.currency)
              : "Not measured"}
          </span>
        );
      },
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.prices.outputPer1M)),
      size: 116,
    },
    {
      id: "context",
      header: "Context",
      accessorKey: "context",
      cell: ({ row }) => {
        const c = row.original.context as unknown;
        return (
          <span className="tnum whitespace-nowrap text-[13px] text-[var(--text-secondary)]">
            {typeof c === "number" && Number.isFinite(c) ? formatTokens(c) : "Not measured"}
          </span>
        );
      },
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.context as unknown as number)),
      size: 90,
    },
    {
      id: "released",
      header: "Released",
      accessorKey: "released",
      cell: ({ row }) => (
        <span className="tnum whitespace-nowrap text-[13px] text-[var(--text-secondary)]">
          {row.original.released ? formatDate(row.original.released) : "—"}
        </span>
      ),
      sortFn: (a, b) => {
        const at = a.original.released ? new Date(a.original.released).getTime() : -Infinity;
        const bt = b.original.released ? new Date(b.original.released).getTime() : -Infinity;
        return at - bt;
      },
      size: 112,
    },
  ];
}

/* ------------------------------------------------------------------ *
 * CSV export — carries the evidence, not just the score.
 * ------------------------------------------------------------------ */

const CSV_HEADERS = [
  "rank",
  "model",
  "slug",
  "provider",
  "family",
  "license",
  "buildId",
  "buildName",
  "playPath",
  "auditDate",
  "mobileReady",
  "overall",
  "bdxScore",
  "showdownV2",
  "controls",
  "combat",
  "content",
  "audio",
  "polish",
  "findings",
  "failing",
  "reasoning",
  "coding",
  "math",
  "knowledge",
  "vision",
  "agentic",
  "speedTps",
  "inputPricePer1M",
  "outputPricePer1M",
  "context",
  "released",
];

function csvEscape(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function leaderboardToCSV(rows: LeaderboardTableRow[]): string {
  const lines = [CSV_HEADERS.join(",")];
  for (const r of rows) {
    const score = showdownScore(r);
    const entry = auditEntryFor(r.slug, score);
    const counts = findingCountsFor(r.slug, score);
    lines.push(
      [
        r.rank ?? "",
        r.name,
        r.slug,
        r.provider,
        r.family ?? "",
        r.openWeights ? "open" : "proprietary",
        entry?.buildId ?? "",
        entry?.buildName ?? "",
        entry?.playPath ?? "",
        entry?.generated ?? "",
        entry ? String(entry.mobileReady) : "",
        r.scores.overall ?? "",
        r.scores.bdxScore ?? "",
        entry?.total ?? "",
        entry?.dims.controls ?? "",
        entry?.dims.combat ?? "",
        entry?.dims.content ?? "",
        entry?.dims.audio ?? "",
        entry?.dims.polish ?? "",
        counts?.total ?? "",
        counts?.failing ?? "",
        r.scores.reasoning ?? "",
        r.scores.coding ?? "",
        r.scores.math ?? "",
        r.scores.knowledge ?? "",
        r.scores.vision ?? "",
        r.scores.agentic ?? "",
        r.speed?.tps ?? "",
        r.prices.inputPer1M ?? "",
        r.prices.outputPer1M ?? "",
        r.context ?? "",
        r.released ?? "",
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return lines.join("\n");
}

export function downloadCSV(filename: string, rows: LeaderboardTableRow[]): void {
  const csv = leaderboardToCSV(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
