'use strict';
// BDX Bench aggregator — zero deps (node builtins only).
// Usage: node scripts/aggregate.js [--dir <resultsDir>]
// Default reads <repo>/results/run-*.json + <repo>/results/demo-*.json
// (recursively, so results/.tmp-test/run-*.json test fixtures are picked up),
// aggregates by model { model, runs, avgScore, passRate, lastRun } as `auto`,
// plus `manual` from <repo>/data/scores.json grouped by model
//   { model, entries, avgScore, lastScore } (mirrors server/server.js
//   buildManualLeaderboard), plus `arena` from <repo>/data/matches.json
//   verdicts + <repo>/data/ratings.json Elo
//   { model, elo, wins, losses, draws } (mirrors server/server.js
//   buildArenaLeaderboard),
// writes <resultsDir>/leaderboard.json { updatedAt, auto, manual, arena },
// and prints auto + manual + arena tables to stdout.
// Missing dir/files => empty arrays, exit 0 (never throws on ENOENT).

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const SCORES_FILE = path.join(DATA_DIR, 'scores.json');
const MATCHES_FILE = path.join(DATA_DIR, 'matches.json');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');

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

// --- Mirrors server/server.js readJsonArrayFile (tolerant: missing/corrupt => []) ---
function readJsonArrayFile(fp) {
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    if (!raw.trim()) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function readRatingsObject(fp) {
  try {
    const raw = fs.readFileSync(fp, 'utf8');
    if (!raw.trim()) return {};
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && !Array.isArray(data)) return data;
    return {};
  } catch (e) {
    return {};
  }
}

// --- Mirrors server/server.js newestFirst ---
function newestFirst(a, b) {
  const ta = (a && a.createdAt) || '';
  const tb = (b && b.createdAt) || '';
  if (ta === tb) {
    const ida = (a && a.id) || '';
    const idb = (b && b.id) || '';
    return ida < idb ? 1 : ida > idb ? -1 : 0; // newest id last on tie
  }
  return ta < tb ? 1 : -1; // newest first
}

// --- Mirrors server/server.js buildManualLeaderboard ---
function buildManualLeaderboard(scores) {
  const byModel = new Map();
  for (const s of scores) {
    if (!s || typeof s.model !== 'string' || !s.model) continue;
    const v = typeof s.score01 === 'number' && Number.isFinite(s.score01) ? s.score01 : 0;
    if (!byModel.has(s.model)) byModel.set(s.model, []);
    byModel.get(s.model).push(s);
    void v;
  }
  const manual = [...byModel.entries()].map(([model, entries]) => {
    const sorted = entries.slice().sort(newestFirst);
    const sum = sorted.reduce((acc, s) => acc + s.score01, 0);
    return {
      model,
      entries: sorted.length,
      avgScore: sorted.length ? sum / sorted.length : 0,
      lastScore: sorted.length ? sorted[0].score01 : 0,
    };
  });
  manual.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    return a.model < b.model ? -1 : 1;
  });
  return manual;
}

// --- Mirrors server/server.js matchWinner / getRating / buildArenaLeaderboard ---
function matchWinner(m) {
  if (!m || typeof m !== 'object') return null;
  if (typeof m.winner === 'string' && (m.winner === 'A' || m.winner === 'B' || m.winner === 'draw')) {
    return m.winner;
  }
  if (m.verdict && typeof m.verdict === 'object' && typeof m.verdict.winner === 'string') {
    const w = m.verdict.winner;
    if (w === 'A' || w === 'B' || w === 'draw') return w;
  }
  return null;
}

function getRating(ratings, model) {
  try {
    const v = ratings ? ratings[model] : undefined;
    if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const e = v.elo;
      if (typeof e === 'number' && Number.isFinite(e)) return Math.round(e);
    }
  } catch (_) {}
  return 1000;
}

function buildArenaLeaderboard(matches, ratings) {
  const stats = new Map();
  function ensure(model) {
    if (!stats.has(model)) stats.set(model, { wins: 0, losses: 0, draws: 0 });
    return stats.get(model);
  }
  const list = Array.isArray(matches) ? matches : [];
  for (const m of list) {
    if (!m || typeof m !== 'object') continue;
    const w = matchWinner(m);
    if (w !== 'A' && w !== 'B' && w !== 'draw') continue;
    const ma = m.sides && m.sides.A && typeof m.sides.A.model === 'string' ? m.sides.A.model : '';
    const mb = m.sides && m.sides.B && typeof m.sides.B.model === 'string' ? m.sides.B.model : '';
    if (!ma || !mb) continue;
    const a = ensure(ma);
    const b = ensure(mb);
    if (w === 'A') {
      a.wins += 1;
      b.losses += 1;
    } else if (w === 'B') {
      b.wins += 1;
      a.losses += 1;
    } else {
      a.draws += 1;
      b.draws += 1;
    }
  }
  if (ratings && typeof ratings === 'object' && !Array.isArray(ratings)) {
    for (const k of Object.keys(ratings)) {
      if (typeof k === 'string' && k) ensure(k);
    }
  }
  const out = [...stats.entries()].map(([model, s]) => ({
    model,
    elo: getRating(ratings, model),
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
  }));
  out.sort((a, b) => {
    if (b.elo !== a.elo) return b.elo - a.elo;
    return a.model < b.model ? -1 : 1;
  });
  return out;
}

function printTable(header, rows) {
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => r[i].length))
  );
  const fmt = (cols) => cols.map((c, i) => c.padEnd(widths[i])).join(' | ');
  console.log(fmt(header));
  console.log(widths.map((w) => '-'.repeat(w)).join(' | '));
  for (const r of rows) console.log(fmt(r));
}

function main() {
  const resultsDir = getResultsDir();

  if (!fs.existsSync(resultsDir)) {
    console.log('No results (empty — missing results dir).');
    printTable(['model', 'runs', 'avgScore', 'passRate', 'lastRun'], []);
    console.log('No manual scores (empty — missing results dir).');
    printTable(['model', 'entries', 'avgScore', 'lastScore'], []);
    console.log('No arena matches (empty — missing results dir).');
    printTable(['model', 'elo', 'wins', 'losses', 'draws'], []);
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

  const auto = [...byModel.entries()].map(([model, acc]) => ({
    model,
    runs: acc.count,
    avgScore: acc.count ? acc.scoreSum / acc.count : 0,
    passRate: acc.count ? acc.passSum / acc.count : 0,
    lastRun: acc.lastRun,
  }));
  auto.sort((a, b) => b.avgScore - a.avgScore || (a.model < b.model ? -1 : a.model > b.model ? 1 : 0));

  // Manual + arena (tolerant: missing/corrupt files => empty arrays).
  let manual = [];
  let arena = [];
  try {
    manual = buildManualLeaderboard(readJsonArrayFile(SCORES_FILE));
  } catch (_) {
    manual = [];
  }
  try {
    arena = buildArenaLeaderboard(readJsonArrayFile(MATCHES_FILE), readRatingsObject(RATINGS_FILE));
  } catch (_) {
    arena = [];
  }

  const leaderboard = {
    updatedAt: new Date().toISOString(),
    auto,
    manual,
    arena,
  };

  fs.writeFileSync(
    path.join(resultsDir, 'leaderboard.json'),
    JSON.stringify(leaderboard, null, 2) + '\n',
    'utf8'
  );

  // Human-readable tables to stdout (no secrets printed).
  if (auto.length === 0) {
    console.log('No results (empty).');
  }
  printTable(
    ['model', 'runs', 'avgScore', 'passRate', 'lastRun'],
    auto.map((e) => [
      e.model,
      String(e.runs),
      e.avgScore.toFixed(4),
      e.passRate.toFixed(4),
      e.lastRun,
    ])
  );

  if (manual.length === 0) {
    console.log('No manual scores (empty).');
  }
  printTable(
    ['model', 'entries', 'avgScore', 'lastScore'],
    manual.map((e) => [
      e.model,
      String(e.entries),
      (typeof e.avgScore === 'number' && Number.isFinite(e.avgScore) ? e.avgScore : 0).toFixed(4),
      String(typeof e.lastScore === 'number' && Number.isFinite(e.lastScore) ? e.lastScore : e.lastScore),
    ])
  );

  if (arena.length === 0) {
    console.log('No arena matches (empty).');
  }
  printTable(
    ['model', 'elo', 'wins', 'losses', 'draws'],
    arena.map((e) => [
      e.model,
      String(e.elo),
      String(e.wins),
      String(e.losses),
      String(e.draws),
    ])
  );
}

main();
