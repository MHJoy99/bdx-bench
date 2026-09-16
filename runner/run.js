#!/usr/bin/env node
'use strict';
/* BDX Bench runner — zero npm dependencies (node built-ins + global fetch only).
 *
 *   node runner/run.js --model <modelId> --suite <swe-mini|terminal-mini> --mode <mock|live> --out <path>
 *
 * Reads tasks/<suite>/*.json (falls back to runner/.sample/*.json when the
 * pack is absent), calls the model per task, applies setupFiles into a temp
 * workdir, writes extracted model code blocks over them, runs checks, and
 * writes the Run JSON to --out. The API key is never printed or logged. */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');

const { complete } = require('./lib/client');
const { runChecks } = require('./lib/checks');
const { applyModelOutput } = require('./lib/patch');

const RUNNER_DIR = __dirname;
const SAMPLE_DIR = path.join(RUNNER_DIR, '.sample');
const TASKS_ROOT = path.join(path.dirname(RUNNER_DIR), 'tasks');
const SUITES = ['swe-mini', 'terminal-mini'];
const LOG_MAX = 4000;

const USAGE = [
  'Usage: node runner/run.js --model <modelId> --suite <swe-mini|terminal-mini> --mode <mock|live> --out <path>',
  '',
  'Options:',
  '  --model <modelId>   Model id sent as {model} in the chat-completions body.',
  '  --suite <name>      Task pack to run: swe-mini | terminal-mini (reads tasks/<suite>/*.json).',
  '  --mode <mode>       mock = canned patch, no network | live = POST $BDX_BASE_URL (default https://gpt.bdx.market/v1)/chat/completions with Bearer $BDX_AI_API_KEY.',
  '  --out <path>        Where to write the Run JSON.',
  '  --help, -h          Show this help.',
  '',
  'Notes:',
  '  - If tasks/<suite>/ has no *.json files, falls back to runner/.sample/*.json (mock smoke fixture).',
  '  - The model API key is never printed or written to logs/output.',
].join('\n');

function failUsage(msg) {
  if (msg) process.stderr.write(`Error: ${msg}\n\n`);
  process.stderr.write(`${USAGE}\n`);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') {
      process.stdout.write(`${USAGE}\n`);
      process.exit(0);
    }
    const m = a.match(/^--([a-zA-Z]+)(?:=(.*))?$/);
    if (!m) failUsage(`unexpected argument: ${a}`);
    const key = m[1];
    if (!['model', 'suite', 'mode', 'out'].includes(key)) failUsage(`unknown option: --${key}`);
    if (opts[key] !== undefined) failUsage(`duplicate option: --${key}`);
    let val = m[2];
    if (val === undefined) {
      val = argv[++i];
      if (val === undefined || val.startsWith('--')) failUsage(`--${key} requires a value`);
    }
    opts[key] = val;
  }
  for (const k of ['model', 'suite', 'mode', 'out']) {
    if (!opts[k]) failUsage(`missing required option --${k}`);
  }
  if (!SUITES.includes(opts.suite)) failUsage(`--suite must be one of: ${SUITES.join('|')}`);
  if (!['mock', 'live'].includes(opts.mode)) failUsage('--mode must be mock|live');
  return opts;
}

// Redact the API key anywhere it might leak into recorded logs/errors.
function redact(s) {
  let out = String(s || '');
  const k = process.env.BDX_AI_API_KEY;
  if (k && k.length >= 4) out = out.split(k).join('[REDACTED]');
  return out;
}

function truncate(s, max = LOG_MAX) {
  const t = String(s || '');
  return t.length > max ? `${t.slice(0, max)}...[truncated ${t.length - max} chars]` : t;
}

function listJsonFiles(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.json'))
    .map((e) => path.join(dir, e.name))
    .sort();
}

// Task-shape tolerant accessors (packs may use slightly different keys).
function taskId(task, file) {
  return task.id ?? task.taskId ?? task.name ?? path.basename(file, '.json');
}
function taskPrompt(task) {
  const p = task.prompt ?? task.instruction ?? task.problem ?? task.description;
  return typeof p === 'string' && p.length > 0 ? p : JSON.stringify(task);
}
function taskSetupFiles(task) {
  const raw = task.setupFiles ?? task.files ?? task.setup ?? {};
  const out = {};
  if (Array.isArray(raw)) {
    for (const e of raw) {
      if (e && typeof e.path === 'string') out[e.path] = typeof e.content === 'string' ? e.content : String(e.content ?? '');
    }
  } else if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      out[k] = typeof v === 'string' ? v : typeof v?.content === 'string' ? v.content : String(v ?? '');
    }
  }
  return out;
}
function taskChecks(task) {
  const c = task.checks ?? task.tests ?? task.eval ?? [];
  return Array.isArray(c) ? c : [];
}

function buildPrompt(task, prompt, files) {
  const names = files.length > 0 ? files.map((f) => `- ${f}`).join('\n') : '(no files)';
  return `${prompt}\n\nWorkspace files:\n${names}\n\nReply with the FULL updated content of every file you change, one fenced code block per file. Put the file path right after the opening fence (e.g. \`\`\`hello.txt) or as a first-line "FILE: <path>" comment. Blocks are written over the workspace files before checks run.`;
}

async function runOneTask({ model, mode, file }) {
  const started = Date.now();
  let taskIdStr = path.basename(file, '.json');
  try {
    const task = JSON.parse(fs.readFileSync(file, 'utf8'));
    taskIdStr = String(taskId(task, file));
    const setupFiles = taskSetupFiles(task);
    const checks = taskChecks(task);
    const files = Object.keys(setupFiles).sort();

    const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'bdx-'));
    try {
      for (const rel of files) {
        const full = path.join(workdir, rel.replace(/^[/\\]+/, ''));
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, setupFiles[rel], 'utf8');
      }
      const prompt = buildPrompt(task, taskPrompt(task), files);
      const modelText = await complete({ model, prompt, mode });
      const { applied, notes } = applyModelOutput(workdir, files, modelText);
      const taskTimeoutMs = typeof task.timeoutSec === 'number' && task.timeoutSec > 0
        ? Math.floor(task.timeoutSec * 1000)
        : undefined;
      const summary = runChecks(workdir, checks, { defaultTimeoutMs: taskTimeoutMs });

      let pass; let score01;
      if (summary.total === 0) {
        pass = false; score01 = 0;
        notes.push('no checks defined for task');
      } else {
        pass = summary.passAll;
        score01 = Math.round((summary.passed / summary.total) * 10000) / 10000;
      }
      const logLines = [
        ...notes.map((n) => `note: ${n}`),
        applied.length > 0
          ? `applied: ${applied.map((a) => `${a.created ? 'created' : 'overwrote'} ${a.path} (${a.bytes}b)`).join(', ')}`
          : 'applied: (none)',
        summary.log,
      ];
      return { taskId: taskIdStr, pass, score01, durationMs: Date.now() - started, log: truncate(redact(logLines.join('\n'))) };
    } finally {
      try {
        fs.rmSync(workdir, { recursive: true, force: true });
      } catch { /* best effort */ }
    }
  } catch (err) {
    return {
      taskId: taskIdStr,
      pass: false,
      score01: 0,
      durationMs: Date.now() - started,
      log: truncate(redact(`harness error: ${String((err && err.message) || err)}`)),
    };
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const startedAt = new Date().toISOString();

  let files = listJsonFiles(path.join(TASKS_ROOT, opts.suite));
  let source = `tasks/${opts.suite}/`;
  if (files.length === 0) {
    files = listJsonFiles(SAMPLE_DIR);
    source = 'runner/.sample/ (fallback)';
  }
  if (files.length === 0) {
    process.stderr.write(`Error: no task files found in tasks/${opts.suite}/ nor runner/.sample/\n`);
    process.exit(1);
  }
  process.stdout.write(`bdx-bench: suite=${opts.suite} mode=${opts.mode} model=${opts.model} tasks=${files.length} source=${source}\n`);

  const results = [];
  for (const file of files) {
    const r = await runOneTask({ model: opts.model, mode: opts.mode, file });
    results.push(r);
    process.stdout.write(`  [${r.pass ? 'PASS' : 'FAIL'}] ${r.taskId} score=${r.score01} ${r.durationMs}ms\n`);
  }

  const passes = results.filter((r) => r.pass).length;
  const finishedAt = new Date().toISOString();
  const run = {
    id: `run-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`,
    model: opts.model,
    suite: opts.suite,
    mode: opts.mode,
    status: 'completed',
    results,
    avgScore: results.length === 0 ? 0 : Math.round((results.reduce((s, r) => s + r.score01, 0) / results.length) * 10000) / 10000,
    passRate: results.length === 0 ? 0 : Math.round((passes / results.length) * 10000) / 10000,
    startedAt,
    finishedAt,
    demo: false,
  };

  const outPath = path.resolve(opts.out);
  try {
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, `${JSON.stringify(run, null, 2)}\n`, 'utf8');
  } catch (err) {
    process.stderr.write(`Error: cannot write --out ${outPath}: ${redact(String((err && err.message) || err))}\n`);
    process.exit(1);
  }
  process.stdout.write(`bdx-bench: ${run.status} passRate=${run.passRate} avgScore=${run.avgScore} out=${outPath}\n`);
}

main().catch((err) => {
  process.stderr.write(`Error: ${redact(String((err && err.message) || err))}\n`);
  process.exit(1);
});
