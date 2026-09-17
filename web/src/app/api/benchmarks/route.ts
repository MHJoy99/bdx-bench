import { BENCHMARKS, BENCHMARK_DETAILS, getBenchmarkEvaluations, getDatasetMeta } from "@/lib/data";
import { jsonOk } from "@/lib/http";

/**
 * GET /api/benchmarks — demo benchmark catalogue + per-suite coverage stats.
 * DEMO DATA. Cached at the edge (dataset profile).
 */
export async function GET() {
  const stats: Record<
    string,
    { modelCount: number; fleetAvg: number; topScore: number; version: string; taskCount: number }
  > = {};
  for (const b of BENCHMARK_DETAILS) {
    const evals = getBenchmarkEvaluations(b.slug);
    const vals = evals.map((e) => e.raw);
    stats[b.slug] = {
      modelCount: evals.length,
      fleetAvg:
        vals.length > 0
          ? Math.round((vals.reduce((a, x) => a + x, 0) / vals.length) * 10) / 10
          : 0,
      topScore: vals.length > 0 ? Math.max(...vals) : 0,
      version: b.version,
      taskCount: b.taskCount,
    };
  }
  return jsonOk({ benchmarks: BENCHMARKS, stats, meta: getDatasetMeta() });
}
