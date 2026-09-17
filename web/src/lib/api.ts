import { z } from "zod";
import {
  BenchmarkSchema,
  LeaderboardRowSchema,
  ModelSchema,
  SourceSchema,
  TrendPointSchema,
} from "@/lib/types";

/**
 * Typed API client — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 *
 * Works in RSC (pass `next: { revalidate }`) and in client components /
 * TanStack Query (`queryKey` factories below; fetchers are plain async fns).
 * All payloads are DEMO DATA (see `@/lib/demo-data`). No secrets, mock only.
 */

// ---------------------------------------------------------------------------
// Base URL + errors
// ---------------------------------------------------------------------------

/** Absolute API base. Same-origin by default; override for SSR/preview. */
export const API_BASE =
  process.env.NEXT_PUBLIC_BDX_BENCH_URL?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown, message?: string) {
    super(message ?? `API request failed with status ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface FetchOptions extends RequestInit {
  /** Override the API base for one call. */
  baseUrl?: string;
}

async function fetchJson<T>(
  path: string,
  schema: z.ZodTypeAny,
  opts: FetchOptions = {},
): Promise<T> {
  const { baseUrl, ...init } = opts;
  const res = await fetch(`${baseUrl ?? API_BASE}${path}`, {
    headers: { Accept: "application/json", ...(init.headers ?? {}) },
    ...init,
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      body != null && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : `GET ${path} -> ${res.status}`;
    throw new ApiError(res.status, body, message);
  }
  return schema.parse(body) as T;
}

// ---------------------------------------------------------------------------
// Shared envelopes
// ---------------------------------------------------------------------------

const FreshnessSchema = z.object({
  evalDate: z.string(),
  benchmarkVersions: z.record(z.string(), z.string()),
  methodologyVersion: z.string(),
  retrievedDate: z.string(),
  refreshLabel: z.string(),
});

const ProvenanceItemSchema = z.object({
  sourceId: z.string(),
  label: z.string(),
  kind: z.enum(["vendor", "benchmark", "harness", "manual"]),
  url: z.string().optional(),
  retrievedAt: z.string(),
  notes: z.string(),
});

const UncertaintySchema = z.object({
  methodologyVersion: z.string(),
  evalCount: z.number(),
  avgCiHalfWidth: z.number(),
  minRuns: z.number(),
  maxRuns: z.number(),
});

const MetaSchema = z.object({
  isLocalEvaluation: z.literal(true),
  freshness: FreshnessSchema,
  provenance: z.array(ProvenanceItemSchema),
  uncertainty: UncertaintySchema,
});

export type ApiMeta = z.infer<typeof MetaSchema>;

// ---------------------------------------------------------------------------
// Endpoint schemas + fetchers
// ---------------------------------------------------------------------------

const EvaluationSchema = z.object({
  modelSlug: z.string(),
  benchmarkSlug: z.string(),
  raw: z.number(),
  normalized: z.number().optional(),
  evaluatedAt: z.string(),
  ciLow: z.number(),
  ciHigh: z.number(),
  runs: z.number(),
  variance: z.number(),
  sourceId: z.string(),
  benchmarkVersion: z.string(),
  methodologyVersion: z.string(),
});
export type ApiEvaluation = z.infer<typeof EvaluationSchema>;

const ModelsResponseSchema = z.object({
  models: z.array(ModelSchema),
  meta: MetaSchema,
});
export type ModelsResponse = z.infer<typeof ModelsResponseSchema>;

export interface ModelsParams extends FetchOptions {
  provider?: string;
  openWeights?: boolean;
  q?: string;
  sort?: "bdxScore" | "overall" | "price" | "speed" | "recent";
  limit?: number;
}

export function fetchModels(params: ModelsParams = {}): Promise<ModelsResponse> {
  const q = new URLSearchParams();
  if (params.provider) q.set("provider", params.provider);
  if (params.openWeights != null) q.set("openWeights", String(params.openWeights));
  if (params.q) q.set("q", params.q);
  if (params.sort) q.set("sort", params.sort);
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return fetchJson<ModelsResponse>(
    `/api/models${qs ? `?${qs}` : ""}`,
    ModelsResponseSchema,
    params,
  );
}

const ModelDetailResponseSchema = z.object({
  model: ModelSchema,
  evaluations: z.array(EvaluationSchema),
  sources: z.array(SourceSchema),
  freshness: FreshnessSchema,
  meta: MetaSchema,
});
export type ModelDetailResponse = z.infer<typeof ModelDetailResponseSchema>;

export function fetchModel(slug: string, opts: FetchOptions = {}): Promise<ModelDetailResponse> {
  return fetchJson<ModelDetailResponse>(
    `/api/models/${encodeURIComponent(slug)}`,
    ModelDetailResponseSchema,
    opts,
  );
}

const LeaderboardResponseSchema = z.object({
  leaderboard: z.array(LeaderboardRowSchema),
  meta: MetaSchema,
});
export type LeaderboardResponse = z.infer<typeof LeaderboardResponseSchema>;

export interface LeaderboardParams extends FetchOptions {
  provider?: string;
  openWeights?: boolean;
  limit?: number;
}

export function fetchLeaderboard(params: LeaderboardParams = {}): Promise<LeaderboardResponse> {
  const q = new URLSearchParams();
  if (params.provider) q.set("provider", params.provider);
  if (params.openWeights != null) q.set("openWeights", String(params.openWeights));
  if (params.limit != null) q.set("limit", String(params.limit));
  const qs = q.toString();
  return fetchJson<LeaderboardResponse>(
    `/api/leaderboard${qs ? `?${qs}` : ""}`,
    LeaderboardResponseSchema,
    params,
  );
}

const BenchmarkStatsSchema = z.object({
  modelCount: z.number(),
  fleetAvg: z.number(),
  topScore: z.number(),
  version: z.string(),
  taskCount: z.number(),
});

const BenchmarksResponseSchema = z.object({
  benchmarks: z.array(BenchmarkSchema),
  stats: z.record(z.string(), BenchmarkStatsSchema),
  meta: MetaSchema,
});
export type BenchmarksResponse = z.infer<typeof BenchmarksResponseSchema>;

export function fetchBenchmarks(opts: FetchOptions = {}): Promise<BenchmarksResponse> {
  return fetchJson<BenchmarksResponse>("/api/benchmarks", BenchmarksResponseSchema, opts);
}

const BenchmarkScoreSchema = z.object({
  modelSlug: z.string(),
  modelName: z.string(),
  provider: z.string(),
  raw: z.number(),
  normalized: z.number(),
  ciLow: z.number(),
  ciHigh: z.number(),
  runs: z.number(),
  evaluatedAt: z.string(),
});
export type BenchmarkScore = z.infer<typeof BenchmarkScoreSchema>;

const BenchmarkDetailResponseSchema = z.object({
  benchmark: BenchmarkSchema,
  scores: z.array(BenchmarkScoreSchema),
  fleet: z.object({
    mean: z.number(),
    stddev: z.number(),
    min: z.number(),
    max: z.number(),
    n: z.number(),
  }),
  freshness: FreshnessSchema,
  provenance: z.array(ProvenanceItemSchema),
  meta: MetaSchema,
});
export type BenchmarkDetailResponse = z.infer<typeof BenchmarkDetailResponseSchema>;

export function fetchBenchmark(slug: string, opts: FetchOptions = {}): Promise<BenchmarkDetailResponse> {
  return fetchJson<BenchmarkDetailResponse>(
    `/api/benchmarks/${encodeURIComponent(slug)}`,
    BenchmarkDetailResponseSchema,
    opts,
  );
}

const CompareResponseSchema = z.object({
  models: z.array(ModelSchema),
  evaluations: z.record(z.string(), z.array(EvaluationSchema)),
  meta: MetaSchema,
});
export type CompareResponse = z.infer<typeof CompareResponseSchema>;

export interface CompareParams extends FetchOptions {
  models: string[];
  benchmark?: string;
}

export function fetchCompare(params: CompareParams): Promise<CompareResponse> {
  const q = new URLSearchParams({ models: params.models.join(",") });
  if (params.benchmark) q.set("benchmark", params.benchmark);
  return fetchJson<CompareResponse>(`/api/compare?${q.toString()}`, CompareResponseSchema, params);
}

const TrendsResponseSchema = z.object({
  trends: z.array(TrendPointSchema),
  meta: MetaSchema,
});
export type TrendsResponse = z.infer<typeof TrendsResponseSchema>;

export interface TrendsParams extends FetchOptions {
  range?: "30d" | "90d" | "1y" | "all";
}

export function fetchTrends(params: TrendsParams = {}): Promise<TrendsResponse> {
  const qs = params.range ? `?range=${params.range}` : "";
  return fetchJson<TrendsResponse>(`/api/trends${qs}`, TrendsResponseSchema, params);
}

// ---------------------------------------------------------------------------
// TanStack Query keys (stable tuples; UI agents wire useQuery themselves)
// ---------------------------------------------------------------------------

export const bdxKeys = {
  all: ["bdx"] as const,
  models: (params?: Omit<ModelsParams, keyof FetchOptions>) =>
    ["bdx", "models", params ?? {}] as const,
  model: (slug: string) => ["bdx", "model", slug] as const,
  leaderboard: (params?: Omit<LeaderboardParams, keyof FetchOptions>) =>
    ["bdx", "leaderboard", params ?? {}] as const,
  benchmarks: () => ["bdx", "benchmarks"] as const,
  benchmark: (slug: string) => ["bdx", "benchmark", slug] as const,
  compare: (slugs: string[], benchmark?: string) =>
    ["bdx", "compare", [...slugs].sort(), benchmark ?? null] as const,
  trends: (range?: TrendsParams["range"]) => ["bdx", "trends", range ?? "all"] as const,
};

/**
 * Minimal query-options shape (structurally compatible with TanStack
 * `queryOptions()` so UI agents can spread it into `useQuery`).
 */
export interface QuerySpec<TData> {
  queryKey: readonly unknown[];
  queryFn: () => Promise<TData>;
}

export const bdxQueries = {
  models: (params: ModelsParams = {}): QuerySpec<ModelsResponse> => ({
    queryKey: bdxKeys.models(params),
    queryFn: () => fetchModels(params),
  }),
  model: (slug: string, opts: FetchOptions = {}): QuerySpec<ModelDetailResponse> => ({
    queryKey: bdxKeys.model(slug),
    queryFn: () => fetchModel(slug, opts),
  }),
  leaderboard: (params: LeaderboardParams = {}): QuerySpec<LeaderboardResponse> => ({
    queryKey: bdxKeys.leaderboard(params),
    queryFn: () => fetchLeaderboard(params),
  }),
  benchmarks: (opts: FetchOptions = {}): QuerySpec<BenchmarksResponse> => ({
    queryKey: bdxKeys.benchmarks(),
    queryFn: () => fetchBenchmarks(opts),
  }),
  benchmark: (slug: string, opts: FetchOptions = {}): QuerySpec<BenchmarkDetailResponse> => ({
    queryKey: bdxKeys.benchmark(slug),
    queryFn: () => fetchBenchmark(slug, opts),
  }),
  compare: (params: CompareParams): QuerySpec<CompareResponse> => ({
    queryKey: bdxKeys.compare(params.models, params.benchmark),
    queryFn: () => fetchCompare(params),
  }),
  trends: (params: TrendsParams = {}): QuerySpec<TrendsResponse> => ({
    queryKey: bdxKeys.trends(params.range),
    queryFn: () => fetchTrends(params),
  }),
};
