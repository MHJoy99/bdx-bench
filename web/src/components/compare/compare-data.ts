import { z } from "zod";
import { MODELS } from "@/lib/data";
import { ModelSchema, type Model } from "@/lib/types";

/**
 * COMPARE slice data contract.
 *
 * - URL schema `/compare?models=a,b` (comma-separated slugs, max 4).
 * - Tray persistence helpers (localStorage).
 * - Local catalog (`DEMO_COMPARE_MODELS`, backed by `@/lib/data`) +
 *   `/api/compare?models=` fetch with local fallback.
 * - Metric definitions + per-metric "stronger" helpers.
 *
 * Integration contracts (owned by other agents — do NOT duplicate here):
 * - Canonical types: `@/lib/types` (Model, ModelSchema). Imported, never redefined.
 * - Future API: `GET /api/compare?models=a,b`, validated server-side with
 *   CompareApiQuerySchema (Zod comma-list, max 4). Response envelope:
 *   `{ "models": Model[] }` (a bare `Model[]` array is also accepted).
 * - UI primitives: `@/components/ui/*` (UI agent).
 * - Charts: `@/components/charts/*`. CompareCharts.tsx renders data-wired
 *   visuals — NOT a duplicate chart lib.
 *
 * NEVER declare an overall winner in this slice. Per-metric "stronger"
 * highlights only (see bestIndexesForMetric). Unmeasured metrics are null
 * ("Not evaluated"/"Not measured") and never highlight.
 */

/** Max models comparable side-by-side on /compare. */
export const COMPARE_MAX_MODELS = 4;

/** Query param carrying the comma-separated slug list. */
export const COMPARE_URL_PARAM = "models" as const;

/** localStorage key for the compare tray (persists across visits on this browser). */
export const COMPARE_TRAY_STORAGE_KEY = "bdx-compare-tray-v1";

/** Where a resolved comparison came from (shown as a source badge, never a secret). */
export type CompareSource = "api" | "demo";

/** All slugs offered by the tray picker (local showdown catalog). */
export const DEMO_MODEL_SLUGS: readonly string[] = [
  "muse-spark-1-3",
  "deepseek-v4-1-flash",
  "space-bunny-free",
  "gpt-6-sol",
  "gpt-5-6-luna",
  "gpt-6-luna",
  "gemini-3-8-flash",
];

/**
 * Local dataset backing /compare until `GET /api/compare` resolves.
 * Same `Model[]` shape as the API; values are the local manual evaluation.
 * No secrets, no live gateway data.
 */
export const DEMO_COMPARE_MODELS: readonly Model[] = MODELS;

// ---------------------------------------------------------------------------
// URL schema: /compare?models=a,b (up to 4)
// ---------------------------------------------------------------------------

/**
 * Parse a comma-separated `?models=` value (or string array) into a clean slug
 * list: trimmed, lowercased, slug-safe, deduped, clamped to COMPARE_MAX_MODELS.
 * Unknown slugs are kept here (the lookup drops them); never throws.
 */
export function parseModelsParam(input: unknown): string[] {
  const parts: string[] =
    typeof input === "string"
      ? input.split(",")
      : Array.isArray(input)
        ? input.flatMap((v) => (typeof v === "string" ? v.split(",") : []))
        : [];
  const seen = new Set<string>();
  for (const raw of parts) {
    const slug = raw.trim().toLowerCase();
    if (!slug || slug.length > 80) continue;
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(slug)) continue;
    if (!seen.has(slug)) seen.add(slug);
    if (seen.size >= COMPARE_MAX_MODELS) break;
  }
  return [...seen];
}

/** Build the shareable path for a slug selection (`/compare?models=a,b`, bare `/compare` when empty). */
export function buildCompareHref(slugs: readonly string[]): string {
  const clean = parseModelsParam([...slugs]);
  if (clean.length === 0) return "/compare";
  return `/compare?${COMPARE_URL_PARAM}=${clean.map(encodeURIComponent).join(",")}`;
}

/** Absolute share URL when an origin is known, otherwise the relative href. */
export function buildShareUrl(slugs: readonly string[], origin?: string): string {
  const href = buildCompareHref(slugs);
  if (origin && origin.length > 0) return `${origin.replace(/\/$/, "")}${href}`;
  return href;
}

/**
 * Server-side contract for the `GET /api/compare?models=a,b` route
 * (Zod comma-list, max 4). API owner: validate `searchParams.models` with this.
 */
export const CompareApiQuerySchema = z.object({
  models: z
    .string()
    .min(1, "models required")
    .transform((s) => parseModelsParam(s))
    .pipe(z.array(z.string()).min(1).max(COMPARE_MAX_MODELS)),
});
export type CompareApiQuery = z.infer<typeof CompareApiQuerySchema>;

// ---------------------------------------------------------------------------
// Data access: /api/compare with local fallback
// ---------------------------------------------------------------------------

/** Order-preserving local lookup; unknown slugs are ignored. */
export function selectDemoModels(slugs: readonly string[]): Model[] {
  const wanted = parseModelsParam([...slugs]);
  const bySlug = new Map(DEMO_COMPARE_MODELS.map((m) => [m.slug, m]));
  const out: Model[] = [];
  for (const slug of wanted) {
    const m = bySlug.get(slug);
    if (m) out.push(m);
  }
  return out;
}

function orderByRequested<T extends { slug: string }>(rows: T[], wanted: readonly string[]): T[] {
  const rank = new Map(wanted.map((s, i) => [s, i] as const));
  return [...rows].sort((a, b) => (rank.get(a.slug) ?? 999) - (rank.get(b.slug) ?? 999));
}

/**
 * Resolve a slug selection to models. Tries `GET /api/compare?models=` first
 * (accepts `{ models: Model[] }` or a bare `Model[]`, drops invalid records);
 * falls back to the local set on any failure. Never throws, never leaks secrets.
 */
export async function fetchCompareModels(
  slugs: readonly string[],
): Promise<{ models: Model[]; source: CompareSource }> {
  const wanted = parseModelsParam([...slugs]);
  const demoFallback = (): { models: Model[]; source: CompareSource } => ({
    models: selectDemoModels(wanted),
    source: "demo",
  });
  if (wanted.length === 0) return { models: [], source: "demo" };
  try {
    const res = await fetch(`/api/compare?${COMPARE_URL_PARAM}=${wanted.map(encodeURIComponent).join(",")}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) return demoFallback();
    const json: unknown = await res.json();
    const raw: unknown[] = Array.isArray(json)
      ? json
      : json !== null && typeof json === "object" && Array.isArray((json as { models?: unknown }).models)
        ? ((json as { models: unknown[] }).models as unknown[])
        : [];
    const valid: Model[] = [];
    for (const item of raw) {
      const parsed = ModelSchema.safeParse(item);
      if (parsed.success) valid.push(parsed.data);
    }
    if (valid.length === 0) return demoFallback();
    return { models: orderByRequested(valid, wanted).slice(0, COMPARE_MAX_MODELS), source: "api" };
  } catch {
    return demoFallback();
  }
}

// ---------------------------------------------------------------------------
// Tray persistence (localStorage)
// ---------------------------------------------------------------------------

/** Read the persisted tray selection. Safe on server (returns []) and on corrupt data. */
export function loadTray(): string[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(COMPARE_TRAY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parseModelsParam(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return [];
  }
}

/** Persist the tray selection. Best-effort; never throws (private mode, SSR, etc.). */
export function saveTray(slugs: readonly string[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(COMPARE_TRAY_STORAGE_KEY, JSON.stringify(parseModelsParam([...slugs])));
  } catch {
    /* ignore persistence failures */
  }
}

// ---------------------------------------------------------------------------
// Metrics: side-by-side rows + per-metric "stronger" (NEVER an overall winner)
// ---------------------------------------------------------------------------

export type CompareMetricKind = "score" | "price" | "speed" | "latency" | "context" | "date" | "bool";

export interface CompareMetricDef {
  key:
    | "overall"
    | "reasoning"
    | "coding"
    | "math"
    | "knowledge"
    | "vision"
    | "agentic"
    | "price"
    | "speed"
    | "latency"
    | "context"
    | "released"
    | "openWeights"
    | "multimodal"
    | "toolCalling";
  label: string;
  hint: string;
  kind: CompareMetricKind;
  /** Numeric direction; null for boolean capability flags (presence is highlighted). */
  higherIsBetter: boolean | null;
}

/** Row order for the side-by-side table (spec order). */
export const COMPARE_METRICS: readonly CompareMetricDef[] = [
  { key: "overall", label: "Overall", hint: "Showdown Score, 0–100 (manual game-build evaluation).", kind: "score", higherIsBetter: true },
  { key: "reasoning", label: "Reasoning", hint: "Reasoning subscore (0–100) — Not evaluated.", kind: "score", higherIsBetter: true },
  { key: "coding", label: "Coding", hint: "Coding subscore (0–100) — Not evaluated.", kind: "score", higherIsBetter: true },
  { key: "math", label: "Math", hint: "Math subscore (0–100) — Not evaluated.", kind: "score", higherIsBetter: true },
  { key: "knowledge", label: "Knowledge", hint: "Knowledge subscore (0–100) — Not evaluated.", kind: "score", higherIsBetter: true },
  { key: "vision", label: "Vision", hint: "Vision subscore (0–100) — Not evaluated.", kind: "score", higherIsBetter: true },
  { key: "agentic", label: "Agentic", hint: "Agentic / tool-use subscore (0–100) — Not evaluated.", kind: "score", higherIsBetter: true },
  { key: "price", label: "Price", hint: "Blended USD per 1M tokens (lower is better) — Not measured.", kind: "price", higherIsBetter: false },
  { key: "speed", label: "Speed", hint: "Median output tokens/sec (higher is better) — Not measured.", kind: "speed", higherIsBetter: true },
  { key: "latency", label: "Latency", hint: "Time to first token in ms (lower is better) — Not measured.", kind: "latency", higherIsBetter: false },
  { key: "context", label: "Context", hint: "Context window in tokens (higher is better) — Not measured.", kind: "context", higherIsBetter: true },
  { key: "released", label: "Release", hint: "Release date (newest highlighted) — unknown.", kind: "date", higherIsBetter: true },
  { key: "openWeights", label: "Open weights", hint: "Whether weights are openly available.", kind: "bool", higherIsBetter: null },
  { key: "multimodal", label: "Multimodal", hint: "Native multimodal input support.", kind: "bool", higherIsBetter: null },
  { key: "toolCalling", label: "Tool calling", hint: "Structured tool/function calling support.", kind: "bool", higherIsBetter: null },
];

/** Raw comparable value for a model × metric (numbers compare directly, dates as ISO strings, null when unmeasured). */
export function getMetricValue(model: Model, key: CompareMetricDef["key"]): number | boolean | string | null {
  switch (key) {
    case "overall":
      return model.scores.overall;
    case "reasoning":
      return model.scores.reasoning;
    case "coding":
      return model.scores.coding;
    case "math":
      return model.scores.math;
    case "knowledge":
      return model.scores.knowledge;
    case "vision":
      return model.scores.vision;
    case "agentic":
      return model.scores.agentic;
    case "price": {
      const input = model.prices.inputPer1M;
      const output = model.prices.outputPer1M;
      if (input == null || output == null) return null;
      return Math.round((input * 0.75 + output * 0.25) * 100) / 100;
    }
    case "speed":
      return model.speed?.tps ?? model.scores.speed ?? null;
    case "latency":
      return model.speed?.ttftMs ?? null;
    case "context":
      return model.context;
    case "released":
      return model.released;
    case "openWeights":
      return model.openWeights;
    case "multimodal":
      return model.capabilities.multimodal;
    case "toolCalling":
      return model.capabilities.tools;
  }
}

/**
 * Indexes of the "stronger" cell(s) for one metric. Ties all highlight; empty
 * when nothing is comparable (including all-null). Booleans highlight presence
 * (`true`). Per-metric only — callers must NEVER reduce this to an overall winner.
 */
export function bestIndexesForMetric(models: readonly Model[], key: CompareMetricDef["key"]): number[] {
  const values = models.map((m) => getMetricValue(m, key));
  if (values.some((v) => typeof v === "boolean")) {
    const out: number[] = [];
    values.forEach((v, i) => {
      if (v === true) out.push(i);
    });
    return out;
  }
  const def = COMPARE_METRICS.find((d) => d.key === key);
  const higher = def?.higherIsBetter ?? true;
  const nums: (number | null)[] = values.map((v) => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const t = Date.parse(v);
      return Number.isFinite(t) ? t : null;
    }
    return null;
  });
  const present = nums.filter((n): n is number => n !== null);
  if (present.length === 0) return [];
  const best = higher ? Math.max(...present) : Math.min(...present);
  const out: number[] = [];
  nums.forEach((n, i) => {
    if (n === best) out.push(i);
  });
  return out;
}
