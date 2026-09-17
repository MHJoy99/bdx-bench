import { z } from "zod";
import { BENCHMARK_CATALOGUE, EVALUATIONS, SCORE_SNAPSHOTS } from "@/lib/demo-data";
import { bdxBenchScore } from "@/lib/scores";

/**
 * Ingestion architecture — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 *
 * Pipeline: validate -> normalize -> dedupe -> snapshot.
 * Pure functions over Zod-validated inputs; no I/O, no secrets, mock only.
 * All current inputs are DEMO DATA (see `@/lib/demo-data`).
 *
 * Methodology versions are append-only: a new version NEVER rewrites rows
 * ingested under an older version — snapshots are namespaced per version
 * (UNIQUE(model, benchmark, benchmark_version, methodology_version)).
 */

// ---------------------------------------------------------------------------
// Methodology registry
// ---------------------------------------------------------------------------

export const METHODOLOGY_REGISTRY = {
  v1: {
    version: "v1",
    frozenAt: "2026-09-01",
    weights: {
      reasoning: 0.2,
      coding: 0.2,
      knowledge: 0.15,
      math: 0.15,
      vision: 0.1,
      agentic: 0.1,
      longContext: 0.05,
      efficiency: 0.05,
    },
    duplicatePolicy: "latest-eval-date-wins",
    notes:
      "Initial demo methodology. Dimension means are averaged per benchmark, " +
      "then combined with the weights above (see lib/scores.ts).",
  },
} as const;

export type MethodologyVersion = keyof typeof METHODOLOGY_REGISTRY;

/** Duplicate-handling policy (advisory constant; enforced by dedupeEvaluations). */
export const DUPLICATE_POLICY = {
  key: ["modelSlug", "benchmarkSlug", "benchmarkVersion", "methodologyVersion"],
  resolution: [
    "1. Latest evaluatedAt wins.",
    "2. Tie on evaluatedAt: higher runs wins.",
    "3. Tie on runs: first-seen wins; the rest are reported as conflicts.",
  ],
  conflictsAreErrors: false,
  conflictReporting: "All dropped rows are returned in DuplicateConflict[] for review.",
} as const;

// ---------------------------------------------------------------------------
// Input schemas (vendor / harness submissions)
// ---------------------------------------------------------------------------

export const RawEvalInputSchema = z.object({
  modelSlug: z.string().min(1).max(80),
  benchmarkSlug: z.string().min(1).max(80),
  /** Raw score on the suite's native scale. */
  scoreRaw: z.number().finite(),
  /** Native scale max (normalizes to 0-100). */
  scaleMax: z.number().positive().default(100),
  runs: z.number().int().positive().max(10_000),
  /** ISO date (YYYY-MM-DD) or datetime of the evaluation. */
  evalDate: z.string().min(8).max(40),
  benchmarkVersion: z.string().min(1).max(20),
  methodologyVersion: z.string().min(1).max(20).default("v1"),
  sourceId: z.string().min(1).max(80),
  ciLow: z.number().finite().optional(),
  ciHigh: z.number().finite().optional(),
  variance: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional(),
});
export type RawEvalInput = z.infer<typeof RawEvalInputSchema>;

export const IngestBatchSchema = z.object({
  batchId: z.string().max(80).optional(),
  sourceId: z.string().min(1).max(80),
  evaluations: z.array(RawEvalInputSchema).min(1).max(5000),
});
export type IngestBatch = z.infer<typeof IngestBatchSchema>;

// ---------------------------------------------------------------------------
// Stage 1 — validate
// ---------------------------------------------------------------------------

export type ValidateResult =
  | { ok: true; rows: RawEvalInput[] }
  | { ok: false; issues: z.ZodIssue[] };

export function validateIngest(input: unknown): ValidateResult {
  const parsed = IngestBatchSchema.safeParse(input);
  if (!parsed.success) return { ok: false, issues: parsed.error.issues };
  const rows = parsed.data.evaluations.map((e) => ({
    ...e,
    sourceId: e.sourceId || parsed.data.sourceId,
  }));
  return { ok: true, rows };
}

// ---------------------------------------------------------------------------
// Stage 2 — normalize (native scale -> 0-100, CI defaults, ISO datetimes)
// ---------------------------------------------------------------------------

export interface NormalizedEval {
  modelSlug: string;
  benchmarkSlug: string;
  raw: number;
  normalized: number;
  ciLow: number;
  ciHigh: number;
  runs: number;
  variance: number;
  evaluatedAt: string; // YYYY-MM-DD
  evaluatedAtTime: string; // ISO datetime (midday UTC, stable)
  sourceId: string;
  benchmarkVersion: string;
  methodologyVersion: string;
  notes: string;
}

/** Default CI half-width when a harness reports no interval (documented). */
export const DEFAULT_CI_HALF_WIDTH = 2.5;

export function normalizeEval(row: RawEvalInput): NormalizedEval {
  const normalized =
    Math.min(100, Math.max(0, Math.round(((row.scoreRaw / row.scaleMax) * 100) * 10) / 10));
  const half =
    row.ciLow != null && row.ciHigh != null
      ? Math.max(0, (row.ciHigh - row.ciLow) / 2)
      : DEFAULT_CI_HALF_WIDTH;
  const day = row.evalDate.slice(0, 10);
  return {
    modelSlug: row.modelSlug.trim().toLowerCase(),
    benchmarkSlug: row.benchmarkSlug.trim().toLowerCase(),
    raw: normalized,
    normalized,
    ciLow: Math.round(Math.max(0, normalized - half) * 10) / 10,
    ciHigh: Math.round(Math.min(100, normalized + half) * 10) / 10,
    runs: row.runs,
    variance: row.variance ?? Math.round(half * half * 0.8 * 100) / 100,
    evaluatedAt: day,
    evaluatedAtTime: `${day}T12:00:00.000Z`,
    sourceId: row.sourceId,
    benchmarkVersion: row.benchmarkVersion,
    methodologyVersion: row.methodologyVersion,
    notes: row.notes ?? "",
  };
}

// ---------------------------------------------------------------------------
// Stage 3 — dedupe (latest eval date wins; conflicts reported, never silent)
// ---------------------------------------------------------------------------

export function duplicateKey(e: Pick<
  NormalizedEval,
  "modelSlug" | "benchmarkSlug" | "benchmarkVersion" | "methodologyVersion"
>): string {
  return [e.modelSlug, e.benchmarkSlug, e.benchmarkVersion, e.methodologyVersion].join("|");
}

export interface DuplicateConflict {
  key: string;
  kept: NormalizedEval;
  dropped: NormalizedEval[];
  reason: string;
}

export interface DedupeResult {
  deduped: NormalizedEval[];
  conflicts: DuplicateConflict[];
}

export function dedupeEvaluations(rows: NormalizedEval[]): DedupeResult {
  const groups = new Map<string, NormalizedEval[]>();
  for (const r of rows) {
    const k = duplicateKey(r);
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }
  const deduped: NormalizedEval[] = [];
  const conflicts: DuplicateConflict[] = [];
  for (const [key, g] of groups) {
    if (g.length === 1) {
      const only = g[0];
      if (only) deduped.push(only);
      continue;
    }
    const ranked = [...g].sort(
      (a, b) =>
        (a.evaluatedAt < b.evaluatedAt ? 1 : a.evaluatedAt > b.evaluatedAt ? -1 : 0) ||
        b.runs - a.runs,
    );
    const kept = ranked[0];
    const dropped = ranked.slice(1);
    if (kept) {
      deduped.push(kept);
      conflicts.push({
        key,
        kept,
        dropped,
        reason:
          "duplicate key: kept latest evaluatedAt (tie: higher runs, then first-seen)",
      });
    }
  }
  return { deduped, conflicts };
}

// ---------------------------------------------------------------------------
// Stage 4 — snapshot (dimension means -> weighted BDX Bench Score)
// ---------------------------------------------------------------------------

export interface SnapshotBuild {
  modelSlug: string;
  dims: Record<string, number>;
  overall: number;
  bdxScore: number;
  evalCount: number;
  imputedDims: string[];
  methodologyVersion: string;
}

export function buildSnapshots(
  evals: NormalizedEval[],
  methodologyVersion: string = "v1",
): SnapshotBuild[] {
  const dimOf = new Map(BENCHMARK_CATALOGUE.map((b) => [b.slug, b.dimension]));
  const byModel = new Map<string, Map<string, number[]>>();
  for (const e of evals) {
    const dim = dimOf.get(e.benchmarkSlug);
    if (!dim || dim === "overall") continue;
    let cell = byModel.get(e.modelSlug);
    if (!cell) {
      cell = new Map<string, number[]>();
      byModel.set(e.modelSlug, cell);
    }
    const arr = cell.get(dim);
    if (arr) arr.push(e.normalized);
    else cell.set(dim, [e.normalized]);
  }
  const mean = (xs: number[]): number =>
    Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;

  return [...byModel.entries()].map(([modelSlug, cell]) => {
    const dims: Record<string, number> = {};
    const imputedDims: string[] = [];
    for (const dim of Object.keys(METHODOLOGY_REGISTRY.v1.weights)) {
      const vals = cell.get(dim);
      if (vals && vals.length > 0) {
        dims[dim] = mean(vals);
      } else {
        const peer = [...cell.values()].flat();
        dims[dim] = peer.length > 0 ? mean(peer) : 0;
        imputedDims.push(dim);
      }
    }
    const overall = mean(Object.values(dims));
    return {
      modelSlug,
      dims,
      overall,
      bdxScore: bdxBenchScore({
        reasoning: dims["reasoning"] ?? 0,
        coding: dims["coding"] ?? 0,
        knowledge: dims["knowledge"] ?? 0,
        math: dims["math"] ?? 0,
        vision: dims["vision"] ?? 0,
        agentic: dims["agentic"] ?? 0,
        longContext: dims["longContext"],
        efficiency: dims["efficiency"],
      }),
      evalCount: [...cell.values()].reduce((a, xs) => a + xs.length, 0),
      imputedDims,
      methodologyVersion,
    };
  });
}

// ---------------------------------------------------------------------------
// Self-check: replay the pipeline over the checked-in demo seed
// ---------------------------------------------------------------------------

export interface ParityReport {
  evalCount: number;
  dedupedCount: number;
  conflictCount: number;
  snapshotCount: number;
  mismatches: { modelSlug: string; pipeline: number; stored: number }[];
  parity: boolean;
}

/**
 * Replays validate->normalize->dedupe->snapshot over EVALUATIONS and checks
 * the rebuilt BDX Bench Scores against the stored snapshots. The demo seed
 * must round-trip with zero conflicts and zero mismatches.
 */
export function rebuildFromSeed(): ParityReport {
  const batch: IngestBatch = {
    batchId: "showdown-seed-replay",
    sourceId: "local-manual-eval",
    evaluations: EVALUATIONS.map((e) => ({
      modelSlug: e.modelSlug,
      benchmarkSlug: e.benchmarkSlug,
      scoreRaw: e.raw,
      scaleMax: 100,
      runs: e.runs,
      evalDate: e.evaluatedAt,
      benchmarkVersion: e.benchmarkVersion,
      methodologyVersion: e.methodologyVersion,
      sourceId: e.sourceId,
      ciLow: e.ciLow,
      ciHigh: e.ciHigh,
      variance: e.variance,
    })),
  };
  const validated = validateIngest(batch);
  if (!validated.ok) {
    return {
      evalCount: EVALUATIONS.length,
      dedupedCount: 0,
      conflictCount: 0,
      snapshotCount: 0,
      mismatches: [],
      parity: false,
    };
  }
  const normalized = validated.rows.map(normalizeEval);
  const { deduped, conflicts } = dedupeEvaluations(normalized);
  const built = buildSnapshots(deduped);
  const stored = new Map(SCORE_SNAPSHOTS.map((s) => [s.modelSlug, s.snapshot.bdxScore]));
  const mismatches: ParityReport["mismatches"] = [];
  for (const b of built) {
    const want = stored.get(b.modelSlug);
    if (want == null || want !== b.bdxScore) {
      mismatches.push({ modelSlug: b.modelSlug, pipeline: b.bdxScore, stored: want ?? NaN });
    }
  }
  return {
    evalCount: normalized.length,
    dedupedCount: built.reduce((a, b) => a + b.evalCount, 0),
    conflictCount: conflicts.length,
    snapshotCount: built.length,
    mismatches,
    parity: conflicts.length === 0 && mismatches.length === 0,
  };
}
