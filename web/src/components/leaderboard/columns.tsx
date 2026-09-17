import Link from "next/link";
import type { LegacyColumnDef } from "@tanstack/react-table/legacy";
import type { Model } from "@/lib/types";
import {
  formatDate,
  formatPrice,
  formatScore,
  formatTokens,
  formatTps,
} from "@/lib/format";

export type LeaderboardTableRow = Model & {
  rank: number;
  rankDelta?: number | null;
};

export const LEADERBOARD_COLUMN_ORDER = [
  "rank",
  "model",
  "provider",
  "overall",
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

export const CATEGORY_TABS = [
  { id: "overall", label: "Overall" },
  { id: "reasoning", label: "Reasoning" },
  { id: "coding", label: "Coding" },
  { id: "math", label: "Math" },
  { id: "knowledge", label: "Knowledge" },
  { id: "vision", label: "Vision" },
  { id: "agentic", label: "Agentic" },
  { id: "speed", label: "Speed" },
] as const;

export type CategoryId = (typeof CATEGORY_TABS)[number]["id"];

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

export function getLeaderboardColumns(): LegacyColumnDef<
  LeaderboardTableRow,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  any
>[] {
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
        const rankBadgeStyle =
          rank === 1
            ? "border-amber-400/40 bg-amber-400/10 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.2)]"
            : rank === 2
              ? "border-slate-300/40 bg-slate-300/10 text-slate-200"
              : rank === 3
                ? "border-amber-700/40 bg-amber-700/15 text-amber-400"
                : "border-[var(--border)] bg-[var(--elevated)] text-[var(--text-secondary)]";

        return (
          <span className="inline-flex items-center gap-1.5 font-mono tnum">
            <span
              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-[6px] border px-1.5 text-[12px] font-bold ${rankBadgeStyle}`}
              aria-label={`Rank ${rank}`}
            >
              {rank || "—"}
            </span>
            {typeof delta === "number" && delta !== 0 ? (
              <span
                aria-label={delta > 0 ? `Up ${delta}` : `Down ${Math.abs(delta)}`}
                title={delta > 0 ? `Up ${delta}` : `Down ${Math.abs(delta)}`}
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
      header: "Model",
      accessorKey: "name",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <span className="flex min-w-0 flex-col">
            <Link
              data-testid="model-link"
              href={`/models/${r.slug}`}
              className="truncate font-medium text-[var(--text)] underline-offset-4 hover:underline hover:text-[var(--accent)] transition-colors"
              title={r.name}
            >
              {r.name}
            </Link>
            <span className="mt-0.5 flex flex-wrap items-center gap-1">
              <span
                className="truncate font-mono text-[11px] text-[var(--text-tertiary)]"
                title={r.slug}
              >
                {r.slug}
              </span>
              <span className="rounded bg-[var(--elevated)] px-1 py-px text-[10px] uppercase tracking-wide text-[var(--text-secondary)]">
                {r.openWeights ? "open-weights" : "proprietary"}
              </span>
            </span>
          </span>
        );
      },
      size: 240,
    },
    {
      id: "provider",
      header: "Provider",
      accessorKey: "provider",
      cell: ({ getValue }) => (
        <span className="whitespace-nowrap text-[13px] capitalize text-[var(--text-secondary)]">
          {String((getValue() as string | null | undefined) ?? "—")}
        </span>
      ),
      size: 130,
    },
    {
      id: "overall",
      header: "Overall",
      accessorFn: (row) => row.scores.overall,
      cell: ({ row }) => (
        <span className={`tnum text-[13px] ${scoreTone(row.original.scores.overall)}`}>
          {scoreText(row.original.scores.overall)}
        </span>
      ),
      sortFn: (a, b) => num(a.original, b.original, (r) => finite(r.scores.overall)),
      size: 84,
    },
    {
      id: "reasoning",
      header: "Reasoning",
      accessorFn: (row) => row.scores.reasoning,
      cell: ({ row }) => (
        <span className={`tnum text-[13px] ${scoreTone(row.original.scores.reasoning)}`}>
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
        <span className={`tnum text-[13px] ${scoreTone(row.original.scores.coding)}`}>
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
        <span className={`tnum text-[13px] ${scoreTone(row.original.scores.math)}`}>
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
        <span className={`tnum text-[13px] ${scoreTone(row.original.scores.knowledge)}`}>
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
        <span className={`tnum text-[13px] ${scoreTone(row.original.scores.vision)}`}>
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
        <span className={`tnum text-[13px] ${scoreTone(row.original.scores.agentic)}`}>
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

const CSV_HEADERS = [
  "rank",
  "model",
  "slug",
  "provider",
  "family",
  "license",
  "overall",
  "bdxScore",
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
    lines.push(
      [
        r.rank ?? "",
        r.name,
        r.slug,
        r.provider,
        r.family ?? "",
        r.openWeights ? "open" : "proprietary",
        r.scores.overall ?? "",
        r.scores.bdxScore ?? "",
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
