/**
 * Route + pipeline smoke test — real local-evaluation dataset.
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
check(r.status === 200 && r.body.models.length === 2, "models: 2 rows");
check(r.body.meta.isLocalEvaluation === true, "models: local-evaluation meta");
check(!JSON.stringify(r.body).match(/demo-helios|Demo Model|fictional/i), "models: no fictional content");
check(cc(r).includes("s-maxage=3600"), "models: edge cache header");
r = await modelsGET(req("/api/models?provider=bdx-ai"));
check(r.body.models.length === 2 && r.body.models.every((m) => m.provider === "bdx-ai"), "models: provider filter");
r = await modelsGET(req("/api/models?openWeights=true"));
check(r.body.models.length === 0, "models: openWeights filter (both closed)");
r = await modelsGET(req("/api/models?limit=1"));
check(r.body.models.length === 1, "models: limit");
r = await modelsGET(req("/api/models?q=spark"));
check(r.body.models.length === 1 && r.body.models[0].slug === "muse-spark-1-3", "models: text query");

// -- /api/models/[slug] ----------------------------------------------------------
r = await modelGET(req("/api/models/muse-spark-1-3"), params("muse-spark-1-3"));
check(r.status === 200 && r.body.model.slug === "muse-spark-1-3", "model detail: slug");
check(r.body.evaluations.length === 1, `model detail: 1 eval (got ${r.body.evaluations.length})`);
check(r.body.sources.length > 0 && r.body.freshness.methodologyVersion === "v1", "model detail: provenance+freshness");
r = await modelGET(req("/api/models/nope"), params("nope"));
check(r.status === 404 && r.body.error === "not found", "model detail: 404");

// -- /api/leaderboard --------------------------------------------------------------
r = await leaderboardGET(req("/api/leaderboard"));
check(r.body.leaderboard.length === 2 && r.body.leaderboard[0].rank === 1, "leaderboard: 2 ranked rows");
check(
  r.body.leaderboard[0].modelSlug === "muse-spark-1-3" && r.body.leaderboard[0].bdxScore === 92,
  "leaderboard: Muse first with 92",
);
check(r.body.meta.uncertainty.evalCount === 2, "leaderboard: uncertainty evalCount");
r = await leaderboardGET(req("/api/leaderboard?limit=1"));
check(r.body.leaderboard.length === 1, "leaderboard: limit");

// -- /api/benchmarks ----------------------------------------------------------------
r = await benchmarksGET();
check(r.body.benchmarks.length === 1, "benchmarks: 1 entry");
check(Object.keys(r.body.stats).length === 1, "benchmarks: stats per suite");

// -- /api/benchmarks/[slug] ------------------------------------------------------------
r = await benchmarkGET(
  req("/api/benchmarks/zombie-flamethrower-showdown"),
  params("zombie-flamethrower-showdown"),
);
check(r.body.benchmark.slug === "zombie-flamethrower-showdown", "benchmark detail: slug");
check(r.body.scores.length === 2 && r.body.fleet.n === 2, "benchmark detail: full fleet");
check(r.body.scores[0].ciLow <= r.body.scores[0].raw, "benchmark detail: CI present");
check(r.body.provenance.length > 0, "benchmark detail: provenance");
r = await benchmarkGET(req("/api/benchmarks/nope"), params("nope"));
check(r.status === 404, "benchmark detail: 404");

// -- /api/compare -----------------------------------------------------------------------
r = await compareGET(req("/api/compare"));
check(r.status === 400, "compare: 400 without models");
r = await compareGET(req("/api/compare?models=muse-spark-1-3,gemini-3-8-flash"));
check(r.status === 200 && r.body.models.length === 2, "compare: 2 models");
check(Object.keys(r.body.evaluations).length === 2, "compare: eval maps");
r = await compareGET(req("/api/compare?models=muse-spark-1-3,nope"));
check(r.status === 400 && r.body.details.unknown.includes("nope"), "compare: 400 unknown slug");

// -- /api/trends --------------------------------------------------------------------------
r = await trendsGET(req("/api/trends"));
check(r.body.trends.length >= 1, "trends: at least single snapshot");
r = await trendsGET(req("/api/trends?range=30d"));
check(Array.isArray(r.body.trends), "trends: 30d window array");

// -- ingest pipeline replay ------------------------------------------------------------------
const report = rebuildFromSeed();
check(report.parity === true, `ingest replay parity (conflicts=${report.conflictCount}, mismatches=${report.mismatches.length})`);
check(report.evalCount === 2 && report.snapshotCount === 2, "ingest replay counts");

// -- page-data builders -------------------------------------------------------------------------
check(getBenchmarksPageData().benchmarks.length === 1, "page-data: benchmarks cards");
check(
  getBenchmarkDetailData("zombie-flamethrower-showdown")?.rows.length === 2,
  "page-data: benchmark rows",
);
check(getBenchmarkDetailData("nope") === null, "page-data: unknown benchmark null");
const pp = getPricePerformanceData();
check(Array.isArray(pp.points) && pp.frontier.length === 0, "page-data: price-performance honest (no frontier without prices)");
check(getTrendsPageData("90d").points.length > 0, "page-data: trends");
const method = getMethodologyData();
check(method.weights.length === 8 && method.version === "v1", "page-data: methodology weights");
check(getModelDetailData("muse-spark-1-3")?.evalCount === 1, "page-data: model detail evals");
check(getModelDetailData("nope") === null, "page-data: unknown model null");

// -- api.ts keys -------------------------------------------------------------------------------------
check(bdxKeys.model("x")[2] === "x" && bdxKeys.trends()[2] === "all", "api: key factories");
check(typeof bdxQueries.leaderboard().queryFn === "function", "api: query specs");

if (failures > 0) {
  console.error(`smoke-routes: ${failures} failure(s)`);
  process.exit(1);
}
console.log("smoke-routes OK (7 routes, ingest replay, page-data, api keys)");
