'use strict';
// BDX Bench API contract tests — zero deps (node:test + node:assert + global fetch).
// Run:  node --test tests/api-contract.test.js
// Boots server/server.js on 127.0.0.1:18765 (NEVER :8765 — live server owns it),
// exercises the API with mock-only calls, then kills the server and deletes any
// run files it created. No live gateway calls, no secrets, no data/ writes.
//
// SPEC-vs-code deviations asserted here (code wins per AGENTS.md §2.1):
//   D1  GET /api/health            -> {ok, version} (SPEC says {ok, mode, time})
//   D2  GET /api/tasks (no suite)  -> 400 {error, suites} (SPEC says 200 all tasks)
//   D3  GET /api/tasks?suite=unknown -> 404 (SPEC says 200 {tasks:[]})
//   D4  GET /api/leaderboard       -> {leaderboard, manual, arena} (three boards, one call)

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const SERVER = path.join(ROOT, 'server', 'server.js');
const RESULTS_DIR = path.join(ROOT, 'results');
const PORT = 18765;
const BASE = `http://127.0.0.1:${PORT}`;

let child = null;
const createdRunIds = [];

async function waitForHealth(tries = 30) {
  let lastErr = '';
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.status === 200) {
        const b = await r.json();
        if (b && b.ok === true) return;
      }
      lastErr = `status ${r.status}`;
    } catch (e) {
      lastErr = e.message;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`test server never healthy: ${lastErr}`);
}

async function json(method, p, body, rawBody) {
  const opts = { method, headers: {} };
  if (rawBody !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = rawBody;
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + p, opts);
  let parsed = null;
  try {
    parsed = await res.json();
  } catch (_) {
    parsed = null;
  }
  return { status: res.status, body: parsed, headers: res.headers };
}

function isJson(res, body) {
  const ct = res.headers.get('content-type') || '';
  assert.ok(ct.includes('application/json'), `content-type must be json, got ${ct}`);
  assert.ok(body && typeof body === 'object', 'body must be parsed JSON');
}

before(async () => {
  child = spawn(process.execPath, [SERVER], {
    env: { ...process.env, BDX_BENCH_PORT: String(PORT), BDX_BENCH_HOST: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});
  await waitForHealth();
});

after(async () => {
  for (const id of createdRunIds) {
    try {
      fs.unlinkSync(path.join(RESULTS_DIR, `${id}.json`));
    } catch (_) {}
  }
  if (child) {
    child.kill();
    await new Promise((r) => setTimeout(r, 300));
    try {
      child.kill('SIGKILL');
    } catch (_) {}
  }
});

describe('health + models (offline-safe)', () => {
  it('GET /api/health -> 200 {ok:true, version} [D1]', async () => {
    const { status, body, headers } = await json('GET', '/api/health');
    assert.equal(status, 200);
    isJson({ headers }, body);
    assert.equal(body.ok, true);
    assert.equal(typeof body.version, 'string');
  });

  it('GET /api/models -> 200 non-empty list, every entry has id+label', async () => {
    const { status, body, headers } = await json('GET', '/api/models');
    assert.equal(status, 200);
    isJson({ headers }, body);
    const models = body.models;
    assert.ok(Array.isArray(models) && models.length > 0, 'models must be non-empty offline');
    for (const m of models) {
      assert.ok(typeof m.id === 'string' && m.id, 'model needs id');
      assert.ok(typeof m.label === 'string' && m.label, `model ${m.id} needs label`);
    }
  });

  it('OPTIONS preflight -> 204 with CORS headers', async () => {
    const res = await fetch(`${BASE}/api/health`, { method: 'OPTIONS' });
    assert.equal(res.status, 204);
    assert.equal(res.headers.get('access-control-allow-origin'), '*');
  });
});

describe('tasks (SPEC D2/D3 deviations)', () => {
  it('GET /api/tasks?suite=swe-mini -> 200, 6 task summaries {id,title,points}', async () => {
    const { status, body } = await json('GET', '/api/tasks?suite=swe-mini');
    assert.equal(status, 200);
    assert.equal(body.suite, 'swe-mini');
    assert.equal(body.tasks.length, 6);
    for (const t of body.tasks) {
      assert.ok(t.id && t.title && typeof t.points === 'number');
    }
  });

  it('GET /api/tasks?suite=terminal-mini -> 200, 6 tasks', async () => {
    const { status, body } = await json('GET', '/api/tasks?suite=terminal-mini');
    assert.equal(status, 200);
    assert.equal(body.tasks.length, 6);
  });

  it('GET /api/tasks (no suite) -> 400 {error, suites} [D2: SPEC says 200]', async () => {
    const { status, body } = await json('GET', '/api/tasks');
    assert.equal(status, 400);
    assert.ok(typeof body.error === 'string');
    assert.ok(Array.isArray(body.suites) && body.suites.includes('swe-mini'));
  });

  it('GET /api/tasks?suite=__nope__ -> 404 [D3: SPEC says 200 {tasks:[]}]', async () => {
    const { status, body } = await json('GET', '/api/tasks?suite=__nope__');
    assert.equal(status, 404);
    assert.ok(typeof body.error === 'string');
  });

  it('path traversal in suite is rejected (400 or 404, never 200)', async () => {
    const { status } = await json('GET', '/api/tasks?suite=..%2Fserver');
    assert.ok(status === 400 || status === 404, `got ${status}`);
  });
});

describe('runs (mock-only)', () => {
  it('POST /api/runs {} -> 400 (model and suite required)', async () => {
    const { status, body } = await json('POST', '/api/runs', {});
    assert.equal(status, 400);
    assert.ok(typeof body.error === 'string');
  });

  it('POST /api/runs {model} without suite -> 400', async () => {
    const { status } = await json('POST', '/api/runs', { model: 'mock-model' });
    assert.equal(status, 400);
  });

  it('POST /api/runs invalid JSON -> 400', async () => {
    const { status, body } = await json('POST', '/api/runs', undefined, '{oops');
    assert.equal(status, 400);
    assert.ok(typeof body.error === 'string');
  });

  it('POST /api/runs?mock=1 -> 201 full mock run; persisted file has no secrets', async () => {
    const { status, body } = await json('POST', '/api/runs?mock=1', { model: 'qa-contract-probe', suite: 'swe-mini' });
    assert.equal(status, 201);
    assert.ok(/^run-/.test(body.id), `run id shape: ${body.id}`);
    createdRunIds.push(body.id);
    assert.equal(body.model, 'qa-contract-probe');
    assert.equal(body.mode, 'mock');
    assert.equal(body.demo, true);
    assert.equal(body.methodologyVersion, 'v1');
    assert.equal(body.results.length, 6);
    assert.equal(body.avgScore, 1);
    assert.equal(body.passRate, 1);

    const fp = path.join(RESULTS_DIR, `${body.id}.json`);
    const raw = fs.readFileSync(fp, 'utf8');
    assert.ok(!raw.includes('BDX_AI_API_KEY'), 'run file must never contain key env name');
    assert.ok(!raw.includes('Bearer'), 'run file must never contain auth material');

    const got = await json('GET', `/api/runs/${body.id}`);
    assert.equal(got.status, 200);
    assert.equal(got.body.id, body.id);
  });

  it('GET /api/runs lists summaries newest-first shape', async () => {
    const { status, body } = await json('GET', '/api/runs');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.runs) && body.runs.length > 0);
    assert.ok(body.runs[0].id && body.runs[0].model);
  });

  it('GET /api/runs/:id unknown -> 404 {error}', async () => {
    const { status, body } = await json('GET', '/api/runs/qa-no-such-run-zzz');
    assert.equal(status, 404);
    assert.ok(typeof body.error === 'string');
  });
});

describe('leaderboard: three boards, one call [D4]', () => {
  it('GET /api/leaderboard -> 200 {leaderboard, manual, arena}', async () => {
    const { status, body } = await json('GET', '/api/leaderboard');
    assert.equal(status, 200);
    for (const k of ['leaderboard', 'manual', 'arena']) {
      assert.ok(Array.isArray(body[k]), `${k} must be an array`);
    }
  });

  it('auto board rows sorted avgScore desc, passRate desc', async () => {
    const { body } = await json('GET', '/api/leaderboard');
    const rows = body.leaderboard;
    assert.ok(rows.length > 0, 'seeded demo runs must produce rows');
    for (const r of rows) {
      assert.ok(r.model && typeof r.runs === 'number');
      assert.ok(r.avgScore >= 0 && r.avgScore <= 1);
      assert.ok(r.passRate >= 0 && r.passRate <= 1);
    }
    for (let i = 1; i < rows.length; i++) {
      const a = rows[i - 1];
      const b = rows[i];
      const okOrder = a.avgScore > b.avgScore ||
        (a.avgScore === b.avgScore && a.passRate >= b.passRate) ||
        (a.avgScore === b.avgScore && a.passRate === b.passRate);
      assert.ok(okOrder, `rows out of order at ${i}: ${a.model} vs ${b.model}`);
    }
  });
});

describe('prompts/scores/matches: validation paths only (no data/ writes)', () => {
  it('GET /api/prompts + GET /api/scores return arrays', async () => {
    const p = await json('GET', '/api/prompts');
    assert.equal(p.status, 200);
    assert.ok(Array.isArray(p.body.prompts));
    const s = await json('GET', '/api/scores');
    assert.equal(s.status, 200);
    assert.ok(Array.isArray(s.body.scores));
  });

  it('POST /api/prompts {} -> 400, nothing persisted', async () => {
    const beforeN = (await json('GET', '/api/prompts')).body.prompts.length;
    const { status } = await json('POST', '/api/prompts', {});
    assert.equal(status, 400);
    const afterN = (await json('GET', '/api/prompts')).body.prompts.length;
    assert.equal(afterN, beforeN);
  });

  it('POST /api/scores {} -> 400', async () => {
    const { status, body } = await json('POST', '/api/scores', {});
    assert.equal(status, 400);
    assert.ok(typeof body.error === 'string');
  });

  it('POST /api/matches {modelA} without modelB -> 400; same-model -> 400', async () => {
    const one = await json('POST', '/api/matches', { modelA: 'a' });
    assert.equal(one.status, 400);
    const same = await json('POST', '/api/matches', { modelA: 'a', modelB: 'a' });
    assert.equal(same.status, 400);
  });

  it('GET /api/matches returns blind summaries (no answers, no models)', async () => {
    const { status, body } = await json('GET', '/api/matches');
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.matches));
    for (const m of body.matches) {
      assert.ok(!('answers' in m), `match ${m.id} list view must hide answers`);
      assert.ok(!('sides' in m), `match ${m.id} list view must hide sides/models`);
    }
  });

  it('unknown API route -> 404 {error}', async () => {
    const { status, body } = await json('GET', '/api/qa-no-such-route');
    assert.equal(status, 404);
    assert.ok(typeof body.error === 'string');
  });
});

describe('static serving (UI currently absent — tolerant)', () => {
  it('GET / returns UI html when present, else JSON 404 (FAIL if UI missing)', async () => {
    const res = await fetch(`${BASE}/`);
    if (res.status === 200) {
      const ct = res.headers.get('content-type') || '';
      assert.ok(ct.includes('text/html'), `UI content-type: ${ct}`);
      const html = await res.text();
      assert.ok(html.toLowerCase().includes('<!doctype html'), 'UI must have doctype');
    } else {
      assert.equal(res.status, 404, 'without UI files, / must 404 as JSON');
      const b = await res.json();
      assert.ok(typeof b.error === 'string');
      // Honest signal: UI agent has not restored public/ yet.
      assert.ok(false, 'BLOCKED: public/ UI files missing — UI agent must restore index.html/app.js/styles.css');
    }
  });
});
