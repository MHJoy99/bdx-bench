/**
 * Data-layer smoke test — real local evaluation dataset.
 * Runs the checked-in seed + data.ts + scores.ts + ingest replay under plain
 * Node (type-stripped; `@/` resolved by test-hooks.mjs). Zero dependencies.
 *
 * Usage (from web/):
 *   node --import ./scripts/test-hooks-register.mjs ./scripts/smoke-data.mjs
 */
import {
  BENCHMARK_CATALOGUE,
  DATASET_META,
  DEMO_BENCHMARKS,
  DEMO_CATEGORY_LEADERS,
  DEMO_DATASET_REFRESH_LABEL,
  DEMO_GLOBAL_STATS,
  DEMO_LATEST_MODELS,
  DEMO_PRICE_POINTS,
  DEMO_TOP_MODELS_BY_CATEGORY,
  DEMO_TREND_SERIES,
  EVALUATIONS,
  FRESHNESS,
  MODELS,
  PROVENANCE,
  PROVIDERS,
  SCORE_SNAPSHOTS,
  SHOWDOWN,
  SHOWDOWN_SCORE_LABEL,
  SOURCES,
  SPEED_TESTS,
  TRENDS,
  UNCERTAINTY,
  demoLeaderboard,
} from "@/lib/demo-data.ts";
import {
  getBenchmark,
  getBenchmarkDetail,
  getBenchmarkEvaluations,
  getDatasetMeta,
  getLeaderboard,
  getModel,
  getModelEvaluations,
  getModelSnapshot,
  getTrends,
} from "@/lib/data.ts";
import { BDX_WEIGHTS, bdxBenchScore, formatDelta, formatScore } from "@/lib/scores.ts";
import { rebuildFromSeed } from "@/lib/ingest.ts";

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log("ok   " + msg);
  } else {
    failures++;
    console.error("FAIL " + msg);
  }
}

const MUSE = "muse-spark-1-3";
const GEMINI = "gemini-3-8-flash";
const SHOWDOWN_SLUG = "zombie-flamethrower-showdown";

// -- seed counts ----------------------------------------------------------------
check(MODELS.length === 2, `2 models (got ${MODELS.length})`);
check(BENCHMARK_CATALOGUE.length === 1, `1 benchmark (got ${BENCHMARK_CATALOGUE.length})`);
check(EVALUATIONS.length === 2, `2 evaluations (got ${EVALUATIONS.length})`);
check(SOURCES.length === 1, `1 source (got ${SOURCES.length})`);
check(PROVIDERS.length === 1, `1 provider (got ${PROVIDERS.length})`);
check(SPEED_TESTS.length === 0, `no speed runs (got ${SPEED_TESTS.length})`);
check(TRENDS.length === 1, `single trend snapshot (got ${TRENDS.length})`);

// -- canonical identity ----------------------------------------------------------
const bySlug = new Map(MODELS.map((m) => [m.slug, m]));
check(bySlug.get(MUSE)?.id === "bdx-ai/go-muse-spark-1.3-contributor", "muse full id");
check(bySlug.get(MUSE)?.name === "Muse Spark 1.3", "muse name");
check(bySlug.get(MUSE)?.family === "Spark", "muse family");
check(bySlug.get(GEMINI)?.id === "bdx-ai/gemini-3.8-flash-tiered", "gemini full id");
check(bySlug.get(GEMINI)?.name === "Gemini 3.8 Flash", "gemini name");
check(bySlug.get(GEMINI)?.family === "Gemini", "gemini family");
check(MODELS.every((m) => m.provider === "bdx-ai"), "provider bdx-ai for both");
check(MODELS.every((m) => m.openWeights === false), "closed weights for both");
check(
  MODELS.every(
    (m) =>
      m.capabilities.tools === false &&
      m.capabilities.vision === false &&
      m.capabilities.audio === false,
  ),
  "no tools/vision/audio claims",
);
check(MODELS.every((m) => m.context === null), "context null (Not measured)");
check(MODELS.every((m) => m.released === null), "released null (unknown)");
check(MODELS.every((m) => m.speed === undefined), "speed omitted (Not measured)");
check(
  MODELS.every((m) => m.prices.inputPer1M === null && m.prices.outputPer1M === null),
  "prices null (Not measured)",
);

// -- showdown scores ---------------------------------------------------------------
const NULL_DIMS = ["reasoning", "coding", "math", "knowledge", "vision", "agentic", "longContext", "efficiency"];
check(bySlug.get(MUSE)?.scores.overall === 92, "muse showdown 92");
check(bySlug.get(MUSE)?.scores.bdxScore === 92, "muse bdxScore 92");
check(bySlug.get(GEMINI)?.scores.overall === 88, "gemini showdown 88");
check(bySlug.get(GEMINI)?.scores.bdxScore === 88, "gemini bdxScore 88");
check(
  MODELS.every((m) => NULL_DIMS.every((d) => m.scores[d] === null)),
  "all other BDX dimensions null (Not evaluated)",
);
check(
  MODELS.every((m) => m.scores.evaluatedAt === "2026-09-17" && m.scores.benchmark === SHOWDOWN_SLUG),
  "score provenance (date + benchmark)",
);
check(
  SHOWDOWN_SCORE_LABEL === "Showdown Score (manual game-build evaluation)",
  "showdown score label exact",
);

// -- benchmark -----------------------------------------------------------------------
const bench = BENCHMARK_CATALOGUE[0];
check(bench?.slug === SHOWDOWN_SLUG, "benchmark slug");
check(bench?.name === "Zombie Flamethrower Showdown", "benchmark name");
check(bench?.category === "coding", "benchmark category coding");
check(bench?.dimension === "coding", "benchmark dimension coding");
check(bench?.taskCount === 1 && bench?.version === "v1", "benchmark version/taskCount");
check(
  (bench?.description ?? "").includes("Showdown Score (manual game-build evaluation)"),
  "benchmark description carries showdown label",
);

// -- evaluations -----------------------------------------------------------------------
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
  EVALUATIONS.every((e) => e.runs === 1 && e.evaluatedAt === "2026-09-17"),
  "single manual run per model on 2026-09-17",
);
check(
  new Set(EVALUATIONS.map((e) => `${e.modelSlug}|${e.benchmarkSlug}|${e.benchmarkVersion}|${e.methodologyVersion}`)).size ===
    EVALUATIONS.length,
  "no duplicate evaluation keys",
);

// -- showdown record ----------------------------------------------------------------------
check(SHOWDOWN.matchId === "m-001" && SHOWDOWN.matchStatus === "open", "match m-001 open");
check(SHOWDOWN.promptTitle === "Zombie flamethrower survival game", "prompt title exact");
check(
  SHOWDOWN.promptBody ===
    "make me a video game where i am killing zombies with fire and all please? a nice wonderfull game i can play for fun okay?",
  "prompt body verbatim",
);
check(
  SHOWDOWN.methodology ===
    "Manual game-build showdown: one shared prompt, binary playability check + feature checklist, community vote open",
  "methodology exact",
);
check(SHOWDOWN.votes.A === 1 && SHOWDOWN.votes.B === 0, "seeded tally A1/B0");
const ansA = SHOWDOWN.answers.find((a) => a.side === "A");
const ansB = SHOWDOWN.answers.find((a) => a.side === "B");
check(
  ansA?.modelSlug === MUSE &&
    ansA?.playPath === "/play/pyro-vs-zombies" &&
    (ansA?.text ?? "").includes("PYRO vs ZOMBIES by Muse Spark 1.3") &&
    (ansA?.text ?? "").includes("Verified playable."),
  "answer A full text + play path",
);
check(
  ansB?.modelSlug === GEMINI &&
    ansB?.playPath === "/play/pyroclasm-inferno" &&
    (ansB?.text ?? "").includes("PYROCLASM: Zombie Inferno by Gemini 3.8 Flash") &&
    (ansB?.text ?? "").includes("Verified playable."),
  "answer B full text + play path",
);
check(
  SHOWDOWN.answers.every((a) => !a.text.includes("localhost") && !a.text.includes("http")),
  "answer texts carry no stale URLs",
);

// -- no banned strings in dataset values ------------------------------------------------------
const banned = [
  "demo-data.bdx-bench.local",
  "fictional",
  "placeholder",
  "synthetic",
  "illustrative",
  "localhost",
  "Demo Model",
];
const blob = JSON.stringify({ MODELS, bench: BENCHMARK_CATALOGUE, EVALUATIONS, SOURCES, SHOWDOWN }).toLowerCase();
check(
  banned.every((w) => !blob.includes(w.toLowerCase())) && !/\bmock\b/.test(blob),
  "no banned strings in dataset values",
);

// -- scoring contract (authority untouched) ------------------------------------------------------
const wsum = Object.values(BDX_WEIGHTS).reduce((a, b) => a + b, 0);
check(Math.abs(wsum - 1) < 1e-9, `BDX weights sum to 1 (got ${wsum})`);
check(
  bdxBenchScore({
    reasoning: 92,
    coding: 92,
    knowledge: 92,
    math: 92,
    vision: 92,
    agentic: 92,
    longContext: 92,
    efficiency: 92,
  }) === 92,
  "bdxBenchScore spot check on explicit numbers",
);
check(formatScore(92.44) === "92.4", "formatScore spot check");
check(formatDelta(1.24) === "+1.2" && formatDelta(-0.44) === "−0.4", "formatDelta spot check");

// -- data.ts accessors ------------------------------------------------------------------------------
check(getModel(MUSE)?.family === "Spark", "getModel by slug");
check(getModel("nope") === undefined, "getModel unknown -> undefined");
check(getBenchmark(SHOWDOWN_SLUG)?.name === "Zombie Flamethrower Showdown", "getBenchmark by slug");
check(getBenchmarkDetail(SHOWDOWN_SLUG)?.dimension === "coding", "catalogue dimension mapping");
const lb = getLeaderboard();
check(lb.length === 2, "leaderboard covers both models");
check(lb[0]?.modelSlug === MUSE && lb[1]?.modelSlug === GEMINI, "leaderboard order muse > gemini");
check(lb.every((r, i) => r.rank === i + 1), "leaderboard ranks sequential");
check(
  lb.every((r) => Number.isNaN(r.pricePer1MBlended)),
  "leaderboard blended price NaN (Not measured)",
);
check(
  JSON.stringify(lb.map((r) => r.modelSlug)) ===
    JSON.stringify(demoLeaderboard.map((r) => r.modelSlug)),
  "demoLeaderboard matches getLeaderboard order",
);
const bdxOnly = getLeaderboard({ provider: "bdx-ai" });
check(bdxOnly.length === 2 && bdxOnly.every((r) => r.provider === "bdx-ai"), "leaderboard provider filter");
check(getModelEvaluations(MUSE).length === 1, "model evaluations single run");
check(getBenchmarkEvaluations(SHOWDOWN_SLUG).length === 2, "benchmark evaluations both models");
check(getModelSnapshot(MUSE)?.evalCount === 1, "model snapshot evalCount");
check(getTrends().length === 1 && getTrends("30d").length === 1, "trends single snapshot (all + 30d)");
check(getModelSnapshot(GEMINI)?.snapshot.bdxScore === 88, "snapshot stored showdown score");

// -- homepage aggregates -------------------------------------------------------------------------------
check(
  DEMO_GLOBAL_STATS.modelsTracked === 2 &&
    DEMO_GLOBAL_STATS.benchmarks === 1 &&
    DEMO_GLOBAL_STATS.evalRuns === 2 &&
    DEMO_GLOBAL_STATS.providers === 1,
  "global stats track real counts",
);
check(DEMO_DATASET_REFRESH_LABEL === "2026-09-17", "refresh label is the eval date");
const overallTab = DEMO_TOP_MODELS_BY_CATEGORY.Overall ?? [];
check(
  overallTab.length === 2 && overallTab[0]?.score === 92 && overallTab[1]?.score === 88,
  "overall tab carries 92/88",
);
check(
  overallTab.every((r) => r.pricePer1M === null && r.speedTps === null && r.contextK === null),
  "top rows honest nulls",
);
check(
  DEMO_CATEGORY_LEADERS.some((c) => c.category === "Showdown" && c.score === 92),
  "showdown category leader",
);
check(DEMO_LATEST_MODELS.length === 0, "no latest rows without release dates");
check(DEMO_PRICE_POINTS.length === 0, "no price points without measured prices");
check(
  DEMO_TREND_SERIES.length === 1 && DEMO_TREND_SERIES[0]?.topScore === 92,
  "single homepage trend point",
);
check(
  DEMO_BENCHMARKS.length === 1 && DEMO_BENCHMARKS[0]?.name === "Zombie Flamethrower Showdown",
  "coverage lists the showdown",
);

// -- ingest replay ------------------------------------------------------------------------------------------
const report = rebuildFromSeed();
check(report.parity === true, `ingest replay parity (conflicts=${report.conflictCount})`);
check(report.evalCount === 2 && report.snapshotCount === 2, "ingest replay counts");

// -- meta envelope -----------------------------------------------------------------------------------------------
const meta = getDatasetMeta();
check(meta.freshness.methodologyVersion === "v1", "meta methodology v1");
check(meta.freshness.evalDate === "2026-09-17", "meta eval date");
check(meta.provenance.length === 1 && meta.provenance[0]?.sourceId === "local-manual-eval", "meta provenance");
check(meta.uncertainty.evalCount === 2, "meta uncertainty evalCount");
check(FRESHNESS.retrievedDate === "2026-09-17" && UNCERTAINTY.minRuns === 1, "freshness/uncertainty present");

if (failures > 0) {
  console.error(`smoke-data: ${failures} failure(s)`);
  process.exit(1);
}
console.log(`smoke-data OK (${MODELS.length} models, ${EVALUATIONS.length} evals)`);
