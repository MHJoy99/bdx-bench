'use strict';
// BDX Bench aggregator — zero deps (node builtins only).
// Usage: node scripts/aggregate.js [--dir <resultsDir>]
// Default reads <repo>/results/run-*.json + <repo>/results/demo-*.json
// (recursively, so results/.tmp-test/run-*.json test fixtures are picked up),
// aggregates by model { model, runs, avgScore, passRate, lastRun },
// writes <resultsDir>/leaderboard.json { updatedAt, entries: [...] },
// and prints a table to stdout. Missing dir => prints empty, exits 0.

const fs = require('fs');
const path = require('path');

function getResultsDir() {
  const flagIdx = process.argv.indexOf('--dir');
  if (flagIdx !== -1 && process.argv[flagIdx + 1]) {
    return path.resolve(process.argv[flagIdx + 1]);
  }
  // <repo>/scripts/aggregate.js -> <repo>/results
  return path.join(__dirname, '..', 'results');
}

function collectJsonFiles(dir) {
  // Recursive walk; match basenames run-*.json / demo-*.json.
  // Skip leaderboard.json and schema.json explicitly.
  const out = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    if (err && err.code === 'ENOENT') return out;
    throw err;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      out.push(...collectJsonFiles(full));
    } else if (ent.isFile()) {
      const base = ent.name;
      if (base === 'leaderboard.json' || base === 'schema.json' || base === '.gitkeep') continue;
      if (/^(run-.*|demo-.*)\.json$/.test(base)) out.push(full);
    }
  }
  return out;
}

function isFiniteNumber(x) {
  return typeof x === 'number' && Number.isFinite(x);
}

function main() {
  const resultsDir = getResultsDir();

  if (!fs.existsSync(resultsDir)) {
    console.log('No results (empty — missing results dir).');
    console.log('model | runs | avgScore | passRate | lastRun');
    console.log('--- | --- | --- | --- | ---');
    return;
  }

  const files = collectJsonFiles(resultsDir).sort();
  /** @type {Map<string, { count: number, scoreSum: number, passSum: number, lastRun: string, lastMtime: number }>} */
  const byModel = new Map();

  for (const file of files) {
    let raw;
    try {
      raw = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      console.error(`warn: skipping invalid JSON: ${path.relative(resultsDir, file)}`);
      continue;
    }
    const model = data && typeof data.model === 'string' ? data.model : null;
    if (!model) {
      console.error(`warn: skipping file without string .model: ${path.relative(resultsDir, file)}`);
      continue;
    }
    let mtimeMs = 0;
    try {
      mtimeMs = fs.statSync(file).mtimeMs || 0;
    } catch {
      mtimeMs = 0;
    }
    const id = typeof data.id === 'string' ? data.id : path.basename(file, '.json');
    const avg = isFiniteNumber(data.avgScore) ? data.avgScore : null;
    const pr = isFiniteNumber(data.passRate) ? data.passRate : null;

    let acc = byModel.get(model);
    if (!acc) {
      acc = { count: 0, scoreSum: 0, passSum: 0, lastRun: id, lastMtime: mtimeMs };
      byModel.set(model, acc);
    }
    acc.count += 1;
    if (avg !== null) acc.scoreSum += avg;
    if (pr !== null) acc.passSum += pr;
    // lastRun = id of most recently modified file (tie-break: larger id wins).
    if (mtimeMs > acc.lastMtime || (mtimeMs === acc.lastMtime && id > acc.lastRun)) {
      acc.lastMtime = mtimeMs;
      acc.lastRun = id;
    }
  }

  const entries = [...byModel.entries()].map(([model, acc]) => ({
    model,
    runs: acc.count,
    avgScore: acc.count ? acc.scoreSum / acc.count : 0,
    passRate: acc.count ? acc.passSum / acc.count : 0,
    lastRun: acc.lastRun,
  }));
  entries.sort((a, b) => b.avgScore - a.avgScore || (a.model < b.model ? -1 : a.model > b.model ? 1 : 0));

  const leaderboard = {
    updatedAt: new Date().toISOString(),
    entries,
  };

  fs.writeFileSync(
    path.join(resultsDir, 'leaderboard.json'),
    JSON.stringify(leaderboard, null, 2) + '\n',
    'utf8'
  );

  // Human-readable table to stdout (no secrets printed).
  if (entries.length === 0) {
    console.log('No results (empty).');
  }
  const header = ['model', 'runs', 'avgScore', 'passRate', 'lastRun'];
  const rows = entries.map((e) => [
    e.model,
    String(e.runs),
    e.avgScore.toFixed(4),
    e.passRate.toFixed(4),
    e.lastRun,
  ]);
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i].length))
  );
  const fmt = (cols) => cols.map((c, i) => c.padEnd(widths[i])).join(' | ');
  console.log(fmt(header));
  console.log(widths.map((w) => '-'.repeat(w)).join(' | '));
  for (const r of rows) console.log(fmt(r));
}

main();
