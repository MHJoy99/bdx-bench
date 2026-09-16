// scripts/seed-demo.js — generates synthetic demo run JSONs. Nothing else.
// Owns ONLY this file's logic; run output files are produced by executing:
//   node scripts/seed-demo.js
// Overwrite-safe: always (re)writes the 3 demo files regardless of tasks/ packs.
const fs = require("fs");
const path = require("path");

const OUT_DIR = path.join(__dirname, "..", "results");

function makeRun({ id, model, suite, specs }) {
  const startedAt = new Date().toISOString();
  const results = specs.map((s, i) => ({
    taskId: s.taskId,
    pass: s.pass,
    score01: s.score01,
    durationMs: 500 + i * 137 + (s.pass ? 211 : 89),
    log: `synthetic demo result — ${s.pass ? "PASS" : "FAIL"} ${s.taskId} in ${id} (mock, no real agent executed)`,
  }));
  const avgScore =
    results.length === 0
      ? 0
      : results.reduce((a, r) => a + r.score01, 0) / results.length;
  const passRate =
    results.length === 0
      ? 0
      : results.filter((r) => r.pass).length / results.length;
  const finishedAt = new Date().toISOString();
  return {
    id,
    model,
    suite,
    mode: "mock",
    status: "completed",
    results,
    avgScore,
    passRate,
    startedAt,
    finishedAt,
    demo: true,
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const runs = [
    {
      filename: "demo-luna-swe.json",
      payload: makeRun({
        id: "demo-luna-swe",
        model: "bdx-ai/gpt-5.6-luna",
        suite: "swe-mini",
        specs: ["swe-01", "swe-02", "swe-03", "swe-04", "swe-05", "swe-06"].map(
          (taskId, i) => ({
            taskId,
            pass: i < 5, // 5 pass / 6
            score01: i < 5 ? 1 : 0, // avgScore 5/6 ≈ 0.83
          })
        ),
      }),
    },
    {
      filename: "demo-spark-term.json",
      payload: makeRun({
        id: "demo-spark-term",
        model: "bdx-ai/go-muse-spark-1.3-contributor",
        suite: "terminal-mini",
        specs: ["term-01", "term-02", "term-03", "term-04", "term-05", "term-06"].map(
          (taskId, i) => ({
            taskId,
            pass: i < 4, // 4 pass / 6
            score01: i < 4 ? 1 : 0, // avgScore 4/6 ≈ 0.67
          })
        ),
      }),
    },
    {
      filename: "demo-gemini-swe.json",
      payload: makeRun({
        id: "demo-gemini-swe",
        model: "bdx-ai/gemini-3.7-flash-tiered",
        suite: "swe-mini",
        specs: ["swe-01", "swe-02", "swe-03", "swe-04", "swe-05", "swe-06"].map(
          (taskId, i) => ({
            taskId,
            pass: i < 3, // 3 pass / 6
            score01: i < 3 ? 1 : 0, // avgScore 3/6 = 0.5
          })
        ),
      }),
    },
  ];

  // Write regardless of tasks/ packs (taskIds are conventional).
  for (const r of runs) {
    const dest = path.join(OUT_DIR, r.filename);
    fs.writeFileSync(dest, JSON.stringify(r.payload, null, 2) + "\n", "utf8");
    const passes = r.payload.results.filter((x) => x.pass).length;
    console.log(
      `wrote ${dest} — ${passes}/${r.payload.results.length} pass, avgScore=${r.payload.avgScore.toFixed(4)}, passRate=${r.payload.passRate.toFixed(4)}`
    );
  }
}

main();
