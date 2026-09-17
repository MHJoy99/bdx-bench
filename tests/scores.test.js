'use strict';
// BDX Bench scoring contract tests — zero deps (node:test + node:assert only).
// Run:  node --test tests/scores.test.js
//        node --test tests/            (whole zero-dep suite incl. tests/smoke.js via glob)
// Mirrors docs/METHODOLOGY.md §4 (avgScore/passRate) + docs/SPEC.md §3-4.
// Reference implementations below MUST match server/server.js scoring semantics.
// If code and docs disagree, code wins — deviations are asserted, not assumed.
//
// Adapted scope note (QA 9/10): the repo has no Next.js `web/` app — the
// "normalizedScore / weights sum=100 / BDX Score label" concepts from the task
// brief are implemented here as the repo's REAL equivalents:
//   normalizedScore  = score01 per result (0|1 in methodology v1)
//   weights          = task `points`; normalized weight = points / totalPoints (sums to 1 = 100%)
//   BDX Score label  = QA-proposed shared display semantic (thresholds below).
// The future web/ UI MUST reuse these exact thresholds (see web/QA_CHECKLIST.md).

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const TASKS_DIR = path.join(ROOT, 'tasks');
const RESULTS_DIR = path.join(ROOT, 'results');

// --- Reference implementations (mirror server/server.js + METHODOLOGY §4) ---

function avgScoreWeighted(results, pointsByTask) {
  // results: [{taskId, pass}]. pointsByTask: {taskId: points} (default 1, mirrors taskSummary fallback).
  let total = 0;
  let earned = 0;
  for (const r of results) {
    const p = typeof pointsByTask[r.taskId] === 'number' && pointsByTask[r.taskId] > 0
      ? pointsByTask[r.taskId]
      : 1;
    total += p;
    if (r.pass) earned += p;
  }
  if (results.length === 0 || total === 0) return 0;
  return earned / total;
}

function passRate(results) {
  if (results.length === 0) return 0;
  return results.filter((r) => r.pass).length / results.length;
}

function normalizedWeights(pointsByTask) {
  const total = Object.values(pointsByTask).reduce((a, b) => a + b, 0);
  const out = {};
  for (const [k, v] of Object.entries(pointsByTask)) out[k] = total > 0 ? v / total : 0;
  return out;
}

// BDX Score label — QA-proposed shared display semantic for any UI (web/ or public/).
// Thresholds are inclusive lower bounds on avgScore (0..1).
function bdxScoreLabel(avg) {
  if (typeof avg !== 'number' || Number.isNaN(avg)) return 'Unranked';
  if (avg >= 0.8) return 'Elite';
  if (avg >= 0.6) return 'Strong';
  if (avg >= 0.4) return 'Competitive';
  if (avg >= 0.2) return 'Developing';
  return 'Early';
}

// SPEC §3 leaderboard row order: avgScore desc, passRate desc, finishedAt asc.
// (Server adds model-id asc as final tiebreak; SPEC names finishedAt asc — both tested.)
function compareLeaderboardRows(a, b) {
  if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
  if (b.passRate !== a.passRate) return b.passRate - a.passRate;
  const fa = a.finishedAt || '';
  const fb = b.finishedAt || '';
  if (fa !== fb) return fa < fb ? -1 : 1;
  return a.model < b.model ? -1 : a.model > b.model ? 1 : 0;
}

// --- Fixture loaders ---

function loadSuiteTasks(suite) {
  const dir = path.join(TASKS_DIR, suite);
  const out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
    out.push({ file: f, data: JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) });
  }
  return out;
}

function loadRunFiles() {
  return fs.readdirSync(RESULTS_DIR)
    .filter((f) => /^(run-.*|demo-.*)\.json$/.test(f))
    .map((f) => ({ file: f, data: JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, f), 'utf8')) }));
}

describe('scoring math (METHODOLOGY §4)', () => {
  it('avgScore is points-weighted: 5/6 equal-weight passes = 0.8333', () => {
    const results = ['swe-01', 'swe-02', 'swe-03', 'swe-04', 'swe-05'].map((taskId) => ({ taskId, pass: true }))
      .concat([{ taskId: 'swe-06', pass: false }]);
    const pts = Object.fromEntries(results.map((r) => [r.taskId, 10]));
    assert.ok(Math.abs(avgScoreWeighted(results, pts) - 5 / 6) < 1e-12);
  });

  it('avgScore weights uneven points (fail on 30pt task hurts more)', () => {
    const results = [
      { taskId: 'a', pass: true }, { taskId: 'b', pass: true }, { taskId: 'c', pass: false },
    ];
    assert.equal(avgScoreWeighted(results, { a: 10, b: 10, c: 30 }), 20 / 50);
    assert.equal(avgScoreWeighted(results, { a: 10, b: 10, c: 10 }), 2 / 3);
  });

  it('passRate is unweighted fraction passed', () => {
    const results = [{ taskId: 'a', pass: true }, { taskId: 'b', pass: false }, { taskId: 'c', pass: false }];
    assert.equal(passRate(results), 1 / 3);
    assert.equal(passRate([]), 0);
    assert.equal(avgScoreWeighted([], {}), 0);
  });

  it('score01 is binary in v1: 1 iff pass', () => {
    for (const { file, data } of loadRunFiles()) {
      for (const r of data.results || []) {
        assert.equal(typeof r.pass, 'boolean', `${file}:${r.taskId} pass must be boolean`);
        assert.ok(r.score01 === 0 || r.score01 === 1, `${file}:${r.taskId} score01 must be 0|1`);
        assert.equal(r.score01, r.pass ? 1 : 0, `${file}:${r.taskId} score01 must equal pass?1:0`);
      }
    }
  });
});

describe('weights: normalized task weights sum to 100%', () => {
  for (const suite of ['swe-mini', 'terminal-mini']) {
    it(`${suite}: normalized weights sum to 1 (100%)`, () => {
      const tasks = loadSuiteTasks(suite);
      assert.ok(tasks.length > 0, `${suite} must have tasks`);
      const pts = Object.fromEntries(tasks.map((t) => [t.data.id, t.data.points]));
      const w = normalizedWeights(pts);
      const sum = Object.values(w).reduce((a, b) => a + b, 0);
      assert.ok(Math.abs(sum - 1) < 1e-9, `${suite} weights sum=${sum}, want 1`);
      const pct = Object.values(w).reduce((a, b) => a + b * 100, 0);
      assert.ok(Math.abs(pct - 100) < 1e-6, `${suite} weights sum=${pct}%, want 100%`);
    });

    it(`${suite}: total points = 60 (6 tasks x 10)`, () => {
      const tasks = loadSuiteTasks(suite);
      assert.equal(tasks.length, 6);
      assert.equal(tasks.reduce((a, t) => a + t.data.points, 0), 60);
    });
  }
});

describe('BDX Score label (shared UI semantic)', () => {
  const cases = [
    [1, 'Elite'], [0.8, 'Elite'],
    [0.7999, 'Strong'], [0.6, 'Strong'],
    [0.5999, 'Competitive'], [0.4, 'Competitive'],
    [0.3999, 'Developing'], [0.2, 'Developing'],
    [0.1999, 'Early'], [0, 'Early'],
  ];
  for (const [avg, want] of cases) {
    it(`avgScore ${avg} -> "${want}"`, () => {
      assert.equal(bdxScoreLabel(avg), want);
    });
  }
  it('non-number -> "Unranked"', () => {
    assert.equal(bdxScoreLabel(NaN), 'Unranked');
    assert.equal(bdxScoreLabel(undefined), 'Unranked');
  });
});

describe('task schema (SPEC §4)', () => {
  const CHECK_TYPES = new Set(['file-contains', 'file-exists', 'shell']);
  for (const suite of fs.readdirSync(TASKS_DIR).filter((d) => fs.statSync(path.join(TASKS_DIR, d)).isDirectory())) {
    for (const { file, data: t } of loadSuiteTasks(suite)) {
      const tag = `${suite}/${file}`;
      it(`${tag}: required fields present`, () => {
        for (const f of ['id', 'suite', 'title', 'kind', 'description', 'prompt', 'setupFiles', 'checks', 'timeoutSec', 'points']) {
          assert.ok(t[f] !== undefined && t[f] !== null && t[f] !== '', `${tag} missing ${f}`);
        }
        assert.equal(t.suite, suite, `${tag} suite must match directory`);
      });
      it(`${tag}: checks non-empty, known types, timeout<=60, points>0`, () => {
        assert.ok(Array.isArray(t.checks) && t.checks.length > 0, `${tag} checks must be non-empty`);
        for (const c of t.checks) {
          assert.ok(CHECK_TYPES.has(c.type), `${tag} unknown check type ${c.type}`);
          if (c.type === 'file-contains') {
            assert.ok(typeof c.path === 'string' && typeof c.contains === 'string', `${tag} file-contains needs path+contains`);
          }
          if (c.type === 'file-exists') assert.ok(typeof c.path === 'string', `${tag} file-exists needs path`);
          if (c.type === 'shell') assert.ok(typeof c.cmd === 'string' && c.cmd, `${tag} shell needs cmd`);
        }
        assert.ok(typeof t.timeoutSec === 'number' && t.timeoutSec > 0 && t.timeoutSec <= 60, `${tag} timeoutSec 1..60`);
        assert.ok(typeof t.points === 'number' && t.points > 0, `${tag} points > 0`);
      });
    }
  }
});

describe('stored runs match recomputed scores', () => {
  it('every run file: stored avgScore/passRate == recomputation from suite points', () => {
    const pointsBySuite = {};
    for (const suite of fs.readdirSync(TASKS_DIR).filter((d) => fs.statSync(path.join(TASKS_DIR, d)).isDirectory())) {
      pointsBySuite[suite] = Object.fromEntries(loadSuiteTasks(suite).map((t) => [t.data.id, t.data.points]));
    }
    for (const { file, data } of loadRunFiles()) {
      const pts = pointsBySuite[data.suite] || {};
      const wantAvg = avgScoreWeighted(data.results || [], pts);
      const wantPr = passRate(data.results || []);
      assert.ok(Math.abs(data.avgScore - wantAvg) < 1e-9, `${file} avgScore ${data.avgScore} != recomputed ${wantAvg}`);
      assert.ok(Math.abs(data.passRate - wantPr) < 1e-9, `${file} passRate ${data.passRate} != recomputed ${wantPr}`);
    }
  });

  it('demo-luna-swe fixture: 5/6 pass -> avgScore=passRate=0.8333', () => {
    const d = JSON.parse(fs.readFileSync(path.join(RESULTS_DIR, 'demo-luna-swe.json'), 'utf8'));
    assert.equal(d.results.filter((r) => r.pass).length, 5);
    assert.ok(Math.abs(d.avgScore - 5 / 6) < 1e-12);
    assert.ok(Math.abs(d.passRate - 5 / 6) < 1e-12);
    assert.equal(d.demo, true);
    assert.equal(bdxScoreLabel(d.avgScore), 'Elite');
  });
});

describe('leaderboard sort (SPEC §3)', () => {
  it('avgScore desc, passRate desc, finishedAt asc', () => {
    const rows = [
      { model: 'm-low', avgScore: 0.5, passRate: 0.5, finishedAt: '2026-09-16T00:00:01Z' },
      { model: 'm-tie-early', avgScore: 0.8, passRate: 0.8, finishedAt: '2026-09-16T00:00:01Z' },
      { model: 'm-tie-late', avgScore: 0.8, passRate: 0.8, finishedAt: '2026-09-16T00:00:02Z' },
      { model: 'm-top', avgScore: 0.9, passRate: 0.1, finishedAt: '2026-09-16T00:00:03Z' },
      { model: 'm-pr', avgScore: 0.8, passRate: 0.9, finishedAt: '2026-09-16T00:00:03Z' },
    ];
    const sorted = rows.slice().sort(compareLeaderboardRows).map((r) => r.model);
    assert.deepEqual(sorted, ['m-top', 'm-pr', 'm-tie-early', 'm-tie-late', 'm-low']);
  });
});
