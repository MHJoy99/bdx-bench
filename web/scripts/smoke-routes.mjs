/**
 * Route + pipeline smoke test — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 * Executes all 7 API handlers plus ingest.rebuildFromSeed() and the
 * page-data builders under plain Node. `zod`/`next/server` are test doubles
 * (test-shims.mjs) so this verifies OUR logic, not the frameworks.
 */
import { GET as modelsGET } from "../src/app/api/models/route.ts";
import { GET as modelGET } from "../src/app/api/models/[slug]/route.ts";
import { GET as leaderboardGET } from "../src/app/api/leaderboard/route.ts";
import { GET as benchmarksGET } from "../src/app/api/benchmarks/route.ts";
import { GET as benchmarkGET } from "../src/app/api/benchmarks/[slug]/route.ts";
import { GET as compareGET } from "../src/app/api/compare/route.ts";
import { GET as trendsGET } from "../src/app/api/trends/route.ts";
import { rebuildFromSeed } from "@/lib/ingest.ts";
import {
  getBenchmarkDetailData,
  getBenchmarksPageData,
  getMethodologyData,
  getModelDetailData,
  getPricePerformanceData,
  getTrendsPageData,
} from "@/lib/page-data.ts";
import { bdxKeys, bdxQueries } from "@/lib/api.ts";

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log("ok   " + msg);
  } else {
    failures++;
    console.error("FAIL " + msg);
  }
}
const req = (url) => ({ url: `http://test${url}` });
const params = (slug) => ({ params: Promise.resolve({ slug }) });
const cc = (res) => res.headers.get("Cache-Control") ?? "";

// -- /api/models ---------------------------------------------------------------
let r = await modelsGET(req("/api/models"));
check(r.status === 200 && r.body.models.length === 22, "models: 22 rows");
check(r.body.meta.isDemoData === true, "models: demo meta");
check(cc(r).includes("s-maxage=3600"), "models: edge cache header");
r = await modelsGET(req("/api/models?provider=meta"));
check(r.body.models.length === 3 && r.body.models.every((m) => m.provider === "meta"), "models: provider filter");
r = await modelsGET(req("/api/models?openWeights=true"));
check(r.body.models.length === 10 && r.body.models.every((m) => m.openWeights), "models: openWeights filter");
r = await modelsGET(req("/api/models?sort=price"));
check(
  r.body.models.every((m, i, a) => i === 0 || 0.75 * a[i - 1].prices.inputPer1M + 0.25 * a[i - 1].prices.outputPer1M <= 0.75 * m.prices.inputPer1M + 0.25 * m.prices.outputPer1M),
  "models: price sort asc",
);
r = await modelsGET(req("/api/models?limit=3"));
check(r.body.models.length === 3, "models: limit");
r = await modelsGET(req("/api/models?q=aurora"));
check(r.body.models.length === 3, "models: text query");

// -- /api/models/[slug] ----------------------------------------------------------
r = await modelGET(req("/api/models/demo-helios-ultra"), params("demo-helios-ultra"));
check(r.status === 200 && r.body.model.slug === "demo-helios-ultra", "model detail: slug");
check(r.body.evaluations.length === 12, `model detail: 12 evals (got ${r.body.evaluations.length})`);
check(r.body.sources.length > 0 && r.body.freshness.methodologyVersion === "v1", "model detail: provenance+freshness");
r = await modelGET(req("/api/models/demo-nope"), params("demo-nope"));
check(r.status === 404 && r.body.error === "not found", "model detail: 404");

// -- /api/leaderboard --------------------------------------------------------------
r = await leaderboardGET(req("/api/leaderboard"));
check(r.body.leaderboard.length === 22 && r.body.leaderboard[0].rank === 1, "leaderboard: 22 ranked rows");
check(r.body.meta.uncertainty.evalCount === 252, "leaderboard: uncertainty evalCount");
r = await leaderboardGET(req("/api/leaderboard?limit=5"));
check(r.body.leaderboard.length === 5, "leaderboard: limit");

// -- /api/benchmarks ----------------------------------------------------------------
r = await benchmarksGET();
check(r.body.benchmarks.length === 12, "benchmarks: 12 entries");
check(Object.keys(r.body.stats).length === 12, "benchmarks: stats per suite");

// -- /api/benchmarks/[slug] ------------------------------------------------------------
r = await benchmarkGET(req("/api/benchmarks/demo-swe-fix"), params("demo-swe-fix"));
check(r.body.benchmark.slug === "demo-swe-fix", "benchmark detail: slug");
check(r.body.scores.length === 22 && r.body.fleet.n === 22, "benchmark detail: full fleet");
check(r.body.scores[0].ciLow <= r.body.scores[0].raw, "benchmark detail: CI present");
check(r.body.provenance.length > 0, "benchmark detail: provenance");
r = await benchmarkGET(req("/api/benchmarks/nope"), params("nope"));
check(r.status === 404, "benchmark detail: 404");

// -- /api/compare -----------------------------------------------------------------------
r = await compareGET(req("/api/compare"));
check(r.status === 400, "compare: 400 without models");
r = await compareGET(req("/api/compare?models=demo-helios-ultra,demo-dune-turbo"));
check(r.status === 200 && r.body.models.length === 2, "compare: 2 models");
check(Object.keys(r.body.evaluations).length === 2, "compare: eval maps");
r = await compareGET(req("/api/compare?models=demo-helios-ultra,nope"));
check(r.status === 400 && r.body.details.unknown.includes("nope"), "compare: 400 unknown slug");

// -- /api/trends --------------------------------------------------------------------------
r = await trendsGET(req("/api/trends"));
check(r.body.trends.length === 7, "trends: full series");
r = await trendsGET(req("/api/trends?range=30d"));
check(r.body.trends.length === 1, `trends: 30d window (got ${r.body.trends.length})`);

// -- ingest pipeline replay ------------------------------------------------------------------
const report = rebuildFromSeed();
check(report.parity === true, `ingest replay parity (conflicts=${report.conflictCount}, mismatches=${report.mismatches.length})`);
check(report.evalCount === 252 && report.snapshotCount === 22, "ingest replay counts");

// -- page-data builders -------------------------------------------------------------------------
check(getBenchmarksPageData().benchmarks.length === 12, "page-data: benchmarks cards");
check(getBenchmarkDetailData("demo-gsm8k")?.rows.length === 22, "page-data: benchmark rows");
check(getBenchmarkDetailData("nope") === null, "page-data: unknown benchmark null");
const pp = getPricePerformanceData();
check(pp.points.length === 22 && pp.frontier.length > 0, "page-data: price-performance + frontier");
check(getTrendsPageData("90d").points.length > 0, "page-data: trends");
const method = getMethodologyData();
check(method.weights.length === 8 && method.version === "v1", "page-data: methodology weights");
check(getModelDetailData("demo-helios-ultra")?.evalCount === 12, "page-data: model detail evals");
check(getModelDetailData("nope") === null, "page-data: unknown model null");

// -- api.ts keys -------------------------------------------------------------------------------------
check(bdxKeys.model("x")[2] === "x" && bdxKeys.trends()[2] === "all", "api: key factories");
check(typeof bdxQueries.leaderboard().queryFn === "function", "api: query specs");

if (failures > 0) {
  console.error(`smoke-routes: ${failures} failure(s)`);
  process.exit(1);
}
console.log("smoke-routes OK (7 routes, ingest replay, page-data, api keys)");
