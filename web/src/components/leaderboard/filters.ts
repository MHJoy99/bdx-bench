import { z } from "zod";
import type { Model } from "@/lib/types";
import type { LeaderboardTableRow } from "./columns";
import {
  CATEGORY_SORT_KEY,
  LEADERBOARD_COLUMN_ORDER,
  type CategoryId,
} from "./columns";

/**
 * URL-persisted view params (?q=&category=&provider=&...).
 * Extends the canonical @/lib/filters LeaderboardFiltersSchema with the
 * capability / price / context / date / sort / pagination / column params
 * required by the leaderboard contract. Same names where they overlap
 * (provider, family, query->q alias, sort) so share URLs stay compatible.
 *
 * openWeights accepts both the canonical "closed" and the task-spec
 * "proprietary" spelling (normalized to "closed").
 */
export const leaderboardFilterParamsSchema = z.object({
  q: z.string().max(120).default(""),
  category: z
    .enum([
      "overall",
      "reasoning",
      "coding",
      "math",
      "knowledge",
      "vision",
      "agentic",
      "speed",
    ])
    .default("overall"),
  provider: z.string().max(40).default("all"),
  family: z.string().max(80).default("all"),
  openWeights: z
    .enum(["all", "open", "closed", "proprietary"])
    .default("all")
    .transform((v) => (v === "proprietary" ? "closed" : v))
    .pipe(z.enum(["all", "open", "closed"])),
  reasoning: z.enum(["all", "yes", "no"]).default("all"),
  vision: z.enum(["all", "yes", "no"]).default("all"),
  tools: z.enum(["all", "yes", "no"]).default("all"),
  minContext: z.coerce.number().int().min(0).max(10_000_000).default(0),
  maxPrice: z.coerce.number().min(0).max(10_000).default(0),
  releasedAfter: z.string().max(10).default(""),
  sort: z.string().max(32).default("overall"),
  dir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(5).max(100).default(25),
  cols: z.string().max(512).default(""),
});

export type LeaderboardFilterParams = z.infer<
  typeof leaderboardFilterParamsSchema
>;

export const DEFAULT_FILTERS: LeaderboardFilterParams = {
  q: "",
  category: "overall",
  provider: "all",
  family: "all",
  openWeights: "all",
  reasoning: "all",
  vision: "all",
  tools: "all",
  minContext: 0,
  maxPrice: 0,
  releasedAfter: "",
  sort: "overall",
  dir: "desc",
  page: 1,
  pageSize: 25,
  cols: "",
};

type SearchParamsLike = {
  get(name: string): string | null;
};

const PARAM_KEYS = [
  "q",
  "query",
  "category",
  "provider",
  "family",
  "openWeights",
  "license",
  "reasoning",
  "vision",
  "tools",
  "minContext",
  "maxPrice",
  "releasedAfter",
  "sort",
  "dir",
  "page",
  "pageSize",
  "cols",
] as const;

/** Parse URLSearchParams (or Next ReadonlyURLSearchParams) with Zod. Falls back to defaults. */
export function parseFilterParams(
  sp: SearchParamsLike | URLSearchParams | null | undefined,
): LeaderboardFilterParams {
  const get = (k: string): string | undefined => {
    try {
      const v = (sp as SearchParamsLike | null | undefined)?.get?.(k);
      return typeof v === "string" && v.length > 0 ? v : undefined;
    } catch {
      return undefined;
    }
  };
  const raw: Record<string, unknown> = {};
  for (const k of PARAM_KEYS) {
    const v = get(k);
    if (v !== undefined) raw[k] = v;
  }
  // Aliases: ?query= (canonical) -> q; ?license=proprietary -> openWeights=closed.
  if (raw.q === undefined && typeof raw.query === "string") raw.q = raw.query;
  if (raw.openWeights === undefined && typeof raw.license === "string") {
    raw.openWeights =
      raw.license === "proprietary" ? "closed" : raw.license;
  }
  delete raw.query;
  delete raw.license;
  if (
    typeof raw.sort === "string" &&
    !(LEADERBOARD_COLUMN_ORDER as readonly string[]).includes(raw.sort)
  ) {
    delete raw.sort;
  }
  if (typeof raw.category === "string" && !(raw.category in CATEGORY_SORT_KEY)) {
    delete raw.category;
  }
  const parsed = leaderboardFilterParamsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  return { ...DEFAULT_FILTERS };
}

/** Serialize filters back to URLSearchParams. Omits defaults for clean share URLs. */
export function serializeFilterParams(
  f: LeaderboardFilterParams,
): URLSearchParams {
  const sp = new URLSearchParams();
  if (f.q.trim()) sp.set("q", f.q.trim());
  if (f.category !== "overall") sp.set("category", f.category);
  if (f.provider !== "all") sp.set("provider", f.provider);
  if (f.family !== "all") sp.set("family", f.family);
  if (f.openWeights !== "all") sp.set("openWeights", f.openWeights);
  if (f.reasoning !== "all") sp.set("reasoning", f.reasoning);
  if (f.vision !== "all") sp.set("vision", f.vision);
  if (f.tools !== "all") sp.set("tools", f.tools);
  if (f.minContext > 0) sp.set("minContext", String(f.minContext));
  if (f.maxPrice > 0) sp.set("maxPrice", String(f.maxPrice));
  if (f.releasedAfter) sp.set("releasedAfter", f.releasedAfter);
  const catSort = CATEGORY_SORT_KEY[f.category as CategoryId] ?? "overall";
  if (f.sort !== catSort || f.dir !== "desc") {
    sp.set("sort", f.sort);
    sp.set("dir", f.dir);
  }
  if (f.page !== 1) sp.set("page", String(f.page));
  if (f.pageSize !== 25) sp.set("pageSize", String(f.pageSize));
  if (f.cols) sp.set("cols", f.cols);
  return sp;
}

/** Score accessor for a category id (used for category-tab ranking). */
export function categoryScore(row: Model, category: string): number {
  const get = (v: unknown): number =>
    typeof v === "number" && Number.isFinite(v) ? v : -Infinity;
  switch (category) {
    case "reasoning":
      return get(row.scores.reasoning);
    case "coding":
      return get(row.scores.coding);
    case "math":
      return get(row.scores.math);
    case "knowledge":
      return get(row.scores.knowledge);
    case "vision":
      return get(row.scores.vision);
    case "agentic":
      return get(row.scores.agentic);
    case "speed":
      return get(row.speed?.tps);
    case "overall":
    default: {
      const bdx = get((row.scores as { bdxScore?: unknown }).bdxScore);
      if (bdx !== -Infinity) return bdx;
      return get(row.scores.overall);
    }
  }
}

/** Pure filtering step (search + faceted filters). Sorting/ranking happens in the table. */
export function applyLeaderboardFilters(
  rows: LeaderboardTableRow[],
  f: LeaderboardFilterParams,
): LeaderboardTableRow[] {
  const q = f.q.trim().toLowerCase();
  const after = f.releasedAfter ? new Date(f.releasedAfter).getTime() : NaN;
  return rows.filter((r) => {
    if (q) {
      const hay =
        `${r.name} ${r.slug} ${r.provider} ${r.family ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.provider !== "all" && r.provider !== f.provider) return false;
    if (f.family !== "all" && (r.family ?? "") !== f.family) return false;
    if (f.openWeights === "open" && !r.openWeights) return false;
    if (f.openWeights === "closed" && r.openWeights) return false;
    if (f.reasoning === "yes" && !r.scores.reasoning) return false;
    if (f.vision === "yes" && !r.capabilities.vision) return false;
    if (f.vision === "no" && r.capabilities.vision) return false;
    if (f.tools === "yes" && !r.capabilities.tools) return false;
    if (f.tools === "no" && r.capabilities.tools) return false;
    if (f.minContext > 0 && (r.context ?? 0) < f.minContext) return false;
    if (f.maxPrice > 0 && (r.prices.inputPer1M ?? Infinity) > f.maxPrice)
      return false;
    if (Number.isFinite(after)) {
      const t = r.released ? new Date(r.released).getTime() : NaN;
      if (!Number.isFinite(t) || t < (after as number)) return false;
    }
    return true;
  });
}

/** Distinct providers/families present in the current rows (for filter dropdowns). */
export function getFilterOptions(rows: Model[]): {
  providers: string[];
  families: string[];
} {
  const providers = new Set<string>();
  const families = new Set<string>();
  for (const r of rows) {
    if (r.provider) providers.add(r.provider);
    if (r.family) families.add(r.family);
  }
  return {
    providers: [...providers].sort((a, b) => a.localeCompare(b)),
    families: [...families].sort((a, b) => a.localeCompare(b)),
  };
}
