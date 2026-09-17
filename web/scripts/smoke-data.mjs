/**
 * Data-layer smoke test — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 * Runs the REAL generated seed + data.ts + scores.ts under plain Node
 * (type-stripped; `@/` resolved by test-hooks.mjs). Zero dependencies.
 *
 * Usage: node --import ./scripts/register-hooks.mjs scripts/smoke-data.mjs
 * (see package.json-adjacent note: run from web/ as
 *  `node --import ./scripts/test-hooks-register.mjs ./scripts/smoke-data.mjs`)
 */
import {
  BENCHMARK_CATALOGUE,
  DATASET_META,
  DEMO_CATEGORY_LEADERS,
  DEMO_DATASET_REFRESH_LABEL,
  DEMO_GLOBAL_STATS,
  DEMO_TREND_SERIES,
  DEMO_TOP_MODELS_BY_CATEGORY,
  EVALUATIONS,
  FRESHNESS,
  MODELS,
  PROVENANCE,
  PROVIDERS,
  SOURCES,
  TRENDS,
  UNCERTAINTY,
  demoLeaderboard,
} from "@/lib/demo-data.ts";
import {
  getBenchmark,
  getBenchmarkDetail,
  getDatasetMeta,
  getLeaderboard,
  getModel,
  getModelEvaluations,
  getTrends,
} from "@/lib/data.ts";
import { BDX_WEIGHTS, bdxBenchScore, formatDelta, formatScore } from "@/lib/scores.ts";

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log("ok   " + msg);
  } else {
    failures++;
    console.error("FAIL " + msg);
  }
}

// -- seed minimums ------------------------------------------------------------
check(PROVIDERS.length >= 7, `providers >= 7 (got ${PROVIDERS.length})`);
check(MODELS.length >= 20, `models >= 20 (got ${MODELS.length})`);
check(BENCHMARK_CATALOGUE.length >= 12, `benchmarks >= 12 (got ${BENCHMARK_CATALOGUE.length})`);
check(EVALUATIONS.length >= 150, `evaluations >= 150 (got ${EVALUATIONS.length})`);
check(SOURCES.length >= 1, `sources >= 1 (got ${SOURCES.length})`);
check(TRENDS.length >= 1, `trend points >= 1 (got ${TRENDS.length})`);

// -- demo-explicit ------------------------------------------------------------
check(MODELS.every((m) => m.name.includes("(demo)")), "every model name carries (demo)");
check(MODELS.every((m) => m.slug.startsWith("demo-")), "every model slug is demo- prefixed");

// -- FK integrity + uncertainty + freshness -----------------------------------
const mslugs = new Set(MODELS.map((m) => m.slug));
const bslugs = new Set(BENCHMARK_CATALOGUE.map((b) => b.slug));
const sids = new Set(SOURCES.map((s) => s.id));
check(
  EVALUATIONS.every((e) => mslugs.has(e.modelSlug) && bslugs.has(e.benchmarkSlug) && sids.has(e.sourceId)),
  "evaluation FK integrity (model/benchmark/source)",
);
check(
  EVALUATIONS.every((e) => e.ciLow <= (e.normalized ?? e.raw) && (e.normalized ?? e.raw) <= e.ciHigh),
  "every evaluation CI brackets its score",
);
check(
  EVALUATIONS.every((e) => e.evaluatedAt <= "2026-09-12"),
  "every evaluation within freshness window",
);
check(
  new Set(EVALUATIONS.map((e) => `${e.modelSlug}|${e.benchmarkSlug}|${e.benchmarkVersion}|${e.methodologyVersion}`)).size ===
    EVALUATIONS.length,
  "no duplicate evaluation keys",
);

// -- scoring contract ----------------------------------------------------------
const wsum = Object.values(BDX_WEIGHTS).reduce((a, b) => a + b, 0);
check(Math.abs(wsum - 1) < 1e-9, `BDX weights sum to 1 (got ${wsum})`);
check(
  MODELS.every((m) => m.scores.bdxScore === bdxBenchScore(m.scores)),
  "stored bdxScore matches lib/scores formula for all models",
);
check(formatScore(92.44) === "92.4", "formatScore spot check");
check(formatDelta(1.24) === "+1.2" && formatDelta(-0.44) === "−0.4", "formatDelta spot check");

// -- data.ts accessors ----------------------------------------------------------
check(getModel("demo-helios-ultra")?.family === "Helios", "getModel by slug");
check(getModel("nope") === undefined, "getModel unknown -> undefined");
check(getBenchmark("demo-swe-fix")?.slug === "demo-swe-fix", "getBenchmark by slug");
check(getBenchmarkDetail("demo-swe-fix")?.dimension === "coding", "catalogue dimension mapping");
const lb = getLeaderboard();
check(lb.length === MODELS.length, "leaderboard covers all models");
check(lb.every((r, i) => r.rank === i + 1), "leaderboard ranks sequential");
check(lb.every((r, i) => i === 0 || lb[i - 1].bdxScore >= r.bdxScore), "leaderboard sorted desc");
check(
  JSON.stringify(lb.map((r) => r.modelSlug)) ===
    JSON.stringify(demoLeaderboard.map((r) => r.modelSlug)),
  "demoLeaderboard matches getLeaderboard order",
);
const metaOnly = getLeaderboard({ provider: "meta" });
check(metaOnly.length > 0 && metaOnly.every((r) => r.provider === "meta"), "leaderboard provider filter");
check(getModelEvaluations("demo-helios-ultra").length > 0, "model evaluations non-empty");
check(getTrends().length === TRENDS.length, "getTrends() full series");
check(getTrends("30d").length < TRENDS.length && getTrends("30d").length > 0, "getTrends(30d) windows");

// -- homepage aggregates ---------------------------------------------------------
check(DEMO_GLOBAL_STATS.modelsTracked === MODELS.length, "global stats track seed counts");
check(Object.keys(DEMO_TOP_MODELS_BY_CATEGORY).length === 9, "9 homepage category tabs");
check(
  Object.values(DEMO_TOP_MODELS_BY_CATEGORY).every((rows) => rows.length > 0 && rows.length <= 5),
  "category tabs have 1-5 rows",
);
check(DEMO_CATEGORY_LEADERS.length === 8, "8 category leaders");
check(DEMO_TREND_SERIES.length === 6, "6 homepage trend points");
check(DEMO_DATASET_REFRESH_LABEL.includes("(demo)"), "refresh label marked demo");

// -- meta envelope ----------------------------------------------------------------
const meta = getDatasetMeta();
check(meta.isDemoData === true, "meta.isDemoData");
check(meta.freshness.methodologyVersion === "v1", "meta methodology v1");
check(meta.provenance.length === PROVENANCE.length && meta.provenance.length > 0, "meta provenance");
check(meta.uncertainty.evalCount === EVALUATIONS.length, "meta uncertainty evalCount");
check(FRESHNESS.retrievedDate.length > 0 && UNCERTAINTY.minRuns > 0, "freshness/uncertainty present");

if (failures > 0) {
  console.error(`smoke-data: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`smoke-data OK (${MODELS.length} models, ${EVALUATIONS.length} evals)`);
