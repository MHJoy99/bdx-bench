import {
  DATASET_FRESHNESS,
  DATASET_PROVENANCE,
  getBenchmark,
  getBenchmarkDetail,
  getBenchmarkEvaluations,
  getDatasetMeta,
  getModel,
} from "@/lib/data";
import { jsonError, jsonOk, SlugSchema } from "@/lib/http";

/**
 * GET /api/benchmarks/[slug] — benchmark meta + per-model scores with
 * uncertainty (CI, runs) + fleet stats + provenance.
 * 404 for unknown slugs.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const check = SlugSchema.safeParse(slug);
  if (!check.success) return jsonError("invalid slug", 400, check.error.issues);
  const benchmark = getBenchmark(check.data);
  const detail = getBenchmarkDetail(check.data);
  if (!benchmark || !detail) return jsonError("not found", 404);

  const scores = getBenchmarkEvaluations(benchmark.slug).map((e) => {
    const m = getModel(e.modelSlug);
    return {
      modelSlug: e.modelSlug,
      modelName: m?.name ?? e.modelSlug,
      provider: m?.provider ?? "other",
      raw: e.raw,
      normalized: e.normalized ?? e.raw,
      ciLow: e.ciLow,
      ciHigh: e.ciHigh,
      runs: e.runs,
      evaluatedAt: e.evaluatedAt,
    };
  });
  const vals = scores.map((s) => s.raw);
  const mean = vals.reduce((a, x) => a + x, 0) / Math.max(1, vals.length);
  const variance =
    vals.reduce((a, x) => a + (x - mean) * (x - mean), 0) / Math.max(1, vals.length);

  return jsonOk({
    benchmark: { ...benchmark, dimension: detail.dimension, version: detail.version, taskCount: detail.taskCount },
    scores,
    fleet: {
      mean: Math.round(mean * 10) / 10,
      stddev: Math.round(Math.sqrt(variance) * 10) / 10,
      min: vals.length > 0 ? Math.min(...vals) : 0,
      max: vals.length > 0 ? Math.max(...vals) : 0,
      n: vals.length,
    },
    freshness: DATASET_FRESHNESS,
    provenance: DATASET_PROVENANCE,
    meta: getDatasetMeta(),
  });
}
