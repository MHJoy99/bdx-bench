// server/server.js — BDX Bench HTTP server (zero npm dependencies).
// Owns ONLY this file. Uses node:http, node:fs, node:path, node:url only.
//
// Contract (v0.1):
//   - Listen on 127.0.0.1:8765, override via $BDX_BENCH_PORT.
//   - Serve static files from public/ (.html/.js/.css/.json).
//   - JSON API:
//       GET  /api/health      -> { ok:true, version:"0.1.0" }
//       GET  /api/models      -> contents of models/models.json, or { models:[] } if missing
//       GET  /api/tasks?suite=<suite> -> summaries { id, title, points } from tasks/<suite>/*.json
//       POST /api/runs { model, suite } (+ ?mock=1 for stub passes)
//       GET  /api/runs        -> list summaries newest first
//       GET  /api/runs/:id    -> full run file or 404
//       GET  /api/leaderboard -> aggregate results/*.json by model
//       GET  /api/prompts      -> manual prompt summaries newest first
//       POST /api/prompts      -> create manual prompt { title, body, tags? }
//       GET  /api/prompts/:id  -> full prompt + its manual scores
//       GET  /api/scores?prompt=<id>&model=<id> -> manual scores newest first
//       POST /api/scores       -> create manual score { promptId, model, answer, score01, notes? }
//       GET  /api/leaderboard -> also includes "manual" grouped by model
//   - Parse JSON bodies manually, CORS *, 404s as JSON.
//   - Manual data persists to data/prompts.json + data/scores.json (tmp+rename writes).

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { URL } = require("node:url");

const VERSION = "0.1.0";
const HOST = "127.0.0.1";
const PORT = (() => {
  const raw = process.env.BDX_BENCH_PORT || "8765";
  const n = parseInt(String(raw), 10);
  return Number.isFinite(n) && n > 0 && n < 65536 ? n : 8765;
})();

const ROOT = path.join(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const MODELS_FILE = path.join(ROOT, "models", "models.json");
const TASKS_DIR = path.join(ROOT, "tasks");
const SUITES_DIR = path.join(ROOT, "suites");
const RESULTS_DIR = path.join(ROOT, "results");
const DATA_DIR = path.join(ROOT, "data");
const PROMPTS_FILE = path.join(DATA_DIR, "prompts.json");
const SCORES_FILE = path.join(DATA_DIR, "scores.json");
const MATCHES_FILE = path.join(DATA_DIR, "matches.json");
const RATINGS_FILE = path.join(DATA_DIR, "ratings.json");
const ARENA_K = 32;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  setCors(res);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      chunks.push(c);
      size += c.length;
      if (size > 1024 * 1024) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      const raw = Buffer.concat(chunks).toString("utf8").trim();
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error("invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

function isSafeName(s) {
  return typeof s === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(s);
}

function isSafeSuite(s) {
  return typeof s === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(s);
}

// Resolve suite directory: prefer tasks/<suite>, fall back to suites/<suite>.
function resolveSuiteDir(suite) {
  if (!isSafeSuite(suite)) return null;
  const a = path.join(TASKS_DIR, suite);
  const b = path.join(SUITES_DIR, suite);
  try {
    if (fs.statSync(a).isDirectory()) return a;
  } catch (_) {}
  try {
    if (fs.statSync(b).isDirectory()) return b;
  } catch (_) {}
  return null;
}

function listSuites() {
  const out = new Set();
  for (const base of [TASKS_DIR, SUITES_DIR]) {
    try {
      const entries = fs.readdirSync(base, { withFileTypes: true });
      for (const e of entries) {
        if (e.isDirectory()) out.add(e.name);
      }
    } catch (_) {}
  }
  return [...out].sort();
}

// Read all task JSON files in a suite dir. Returns [{ file, data }].
function readSuiteTasks(suiteDir) {
  let files = [];
  try {
    files = fs.readdirSync(suiteDir).filter((f) => f.endsWith(".json")).sort();
  } catch (_) {
    return [];
  }
  const tasks = [];
  for (const f of files) {
    const fp = path.join(suiteDir, f);
    try {
      const st = fs.statSync(fp);
      if (!st.isFile()) continue;
      const raw = fs.readFileSync(fp, "utf8");
      const data = JSON.parse(raw);
      tasks.push({ file: f, data });
    } catch (_) {
      // Skip unreadable / invalid task files.
    }
  }
  return tasks;
}

function taskSummary(entry) {
  const d = entry.data || {};
  const fallbackId = entry.file ? entry.file.replace(/\.json$/i, "") : "unknown";
  const id = typeof d.id === "string" && d.id ? d.id : fallbackId;
  const title = typeof d.title === "string" && d.title ? d.title : id;
  const points = typeof d.points === "number" && Number.isFinite(d.points) ? d.points : 1;
  return { id, title, points };
}

function readResultsFiles() {
  let files = [];
  try {
    files = fs.readdirSync(RESULTS_DIR).filter((f) => f.endsWith(".json")).sort();
  } catch (_) {
    return [];
  }
  const runs = [];
  for (const f of files) {
    const fp = path.join(RESULTS_DIR, f);
    try {
      if (!fs.statSync(fp).isFile()) continue;
      const data = JSON.parse(fs.readFileSync(fp, "utf8"));
      runs.push({ file: f, data });
    } catch (_) {
      // Skip invalid files.
    }
  }
  return runs;
}

function runSummary(d) {
  const results = Array.isArray(d.results) ? d.results : [];
  return {
    id: d.id,
    model: d.model,
    suite: d.suite,
    mode: d.mode,
    status: d.status,
    avgScore: typeof d.avgScore === "number" ? d.avgScore : 0,
    passRate: typeof d.passRate === "number" ? d.passRate : 0,
    startedAt: d.startedAt,
    finishedAt: d.finishedAt,
    demo: d.demo === true,
    taskCount: results.length,
  };
}

// --- Manual prompt/score persistence (data/prompts.json + data/scores.json) ---
function readJsonArrayFile(fp) {
  try {
    const raw = fs.readFileSync(fp, "utf8");
    if (!raw.trim()) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    // Missing file -> empty collection; corrupt JSON -> empty (keeps GETs alive).
    return [];
  }
}

function writeJsonAtomic(fp, data) {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  const tmp =
    fp + ".tmp-" + process.pid + "-" + Date.now().toString(36) + "-" + Math.random().toString(16).slice(2, 8);
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, fp);
}

function loadPrompts() {
  return readJsonArrayFile(PROMPTS_FILE);
}

function loadScores() {
  return readJsonArrayFile(SCORES_FILE);
}

function nextSeqId(prefix, items) {
  let max = 0;
  for (const it of items) {
    if (!it || typeof it.id !== "string") continue;
    const m = it.id.match(new RegExp("^" + prefix + "-(\\d+)$"));
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > max) max = n;
    }
  }
  return prefix + "-" + String(max + 1).padStart(3, "0");
}

function newestFirst(a, b) {
  const ta = (a && a.createdAt) || "";
  const tb = (b && b.createdAt) || "";
  if (ta === tb) {
    const ida = (a && a.id) || "";
    const idb = (b && b.id) || "";
    return ida < idb ? 1 : ida > idb ? -1 : 0; // newest id last on tie
  }
  return ta < tb ? 1 : -1; // newest first
}

function promptSummary(p) {
  return {
    id: p.id,
    title: p.title,
    tags: Array.isArray(p.tags) ? p.tags : [],
    createdAt: p.createdAt,
  };
}

function normalizeTags(tags) {
  if (tags === undefined) return [];
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t) => typeof t === "string")
    .map((t) => t.trim())
    .filter((t) => t);
}

function clamp01(n) {
  if (!Number.isFinite(n)) return 0;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function buildManualLeaderboard(scores) {
  const byModel = new Map();
  for (const s of scores) {
    if (!s || typeof s.model !== "string" || !s.model) continue;
    const v = typeof s.score01 === "number" && Number.isFinite(s.score01) ? s.score01 : 0;
    if (!byModel.has(s.model)) byModel.set(s.model, []);
    byModel.get(s.model).push(s);
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

// --- BDX Arena match engine (data/matches.json + data/ratings.json) ---
function loadMatches() {
  return readJsonArrayFile(MATCHES_FILE);
}

function saveMatches(matches) {
  writeJsonAtomic(MATCHES_FILE, matches);
}

function loadRatings() {
  try {
    const raw = fs.readFileSync(RATINGS_FILE, "utf8");
    if (!raw.trim()) return {};
    const data = JSON.parse(raw);
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
    return {};
  } catch (e) {
    // Missing file -> empty ratings; corrupt JSON -> empty (keeps GETs alive).
    return {};
  }
}

function saveRatings(ratings) {
  writeJsonAtomic(RATINGS_FILE, ratings && typeof ratings === "object" ? ratings : {});
}

function getRating(ratings, model) {
  try {
    const v = ratings ? ratings[model] : undefined;
    if (typeof v === "number" && Number.isFinite(v)) return Math.round(v);
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const e = v.elo;
      if (typeof e === "number" && Number.isFinite(e)) return Math.round(e);
    }
  } catch (_) {}
  return 1000;
}

function setRating(ratings, model, elo) {
  const cur = ratings ? ratings[model] : undefined;
  if (cur && typeof cur === "object" && !Array.isArray(cur)) {
    cur.elo = elo;
    ratings[model] = cur;
  } else {
    ratings[model] = elo;
  }
}

function randomHex(n) {
  let s = "";
  while (s.length < n) s += Math.random().toString(16).slice(2);
  return s.slice(0, n);
}

function resolveArenaPromptTitle(promptId, taskRef) {
  if (promptId) {
    try {
      const prompts = loadPrompts();
      const p = prompts.find((x) => x && x.id === promptId);
      if (p && typeof p.title === "string" && p.title) return p.title;
    } catch (_) {}
  }
  if (taskRef) {
    try {
      const suites = listSuites();
      for (const suite of suites) {
        const dir = resolveSuiteDir(suite);
        if (!dir) continue;
        const entries = readSuiteTasks(dir);
        for (const entry of entries) {
          const s = taskSummary(entry);
          if (s.id === taskRef) return s.title;
        }
      }
    } catch (_) {}
  }
  if (promptId) return promptId;
  if (taskRef) return taskRef;
  return "";
}

function isMatchDecided(m) {
  if (!m || typeof m !== "object") return false;
  if (m.status === "verdict") return true;
  if (m.verdict && typeof m.verdict === "object" && typeof m.verdict.winner === "string") return true;
  return false;
}

function matchWinner(m) {
  if (!m || typeof m !== "object") return null;
  if (typeof m.winner === "string" && (m.winner === "A" || m.winner === "B" || m.winner === "draw")) {
    return m.winner;
  }
  if (m.verdict && typeof m.verdict === "object" && typeof m.verdict.winner === "string") {
    const w = m.verdict.winner;
    if (w === "A" || w === "B" || w === "draw") return w;
  }
  return null;
}

function matchPromptTitle(m) {
  if (!m || typeof m !== "object") return "";
  if (typeof m.promptTitle === "string" && m.promptTitle) return m.promptTitle;
  if (m.prompt && typeof m.prompt === "object" && typeof m.prompt.title === "string") return m.prompt.title;
  return "";
}

// Public view: hide model identities while open unless reveal requested or decided.
function publicMatch(m, reveal) {
  const decided = isMatchDecided(m);
  const showModels = decided || reveal === true;
  const modelA =
    m.sides && m.sides.A && typeof m.sides.A.model === "string" ? m.sides.A.model : "";
  const modelB =
    m.sides && m.sides.B && typeof m.sides.B.model === "string" ? m.sides.B.model : "";
  const sides = showModels
    ? { A: { label: "A", model: modelA }, B: { label: "B", model: modelB } }
    : { A: { label: "A" }, B: { label: "B" } };
  const promptObj = m.prompt && typeof m.prompt === "object" ? m.prompt : {};
  const promptId = typeof promptObj.promptId === "string" ? promptObj.promptId : (typeof m.promptId === "string" ? m.promptId : "");
  const taskRef = typeof promptObj.taskRef === "string" ? promptObj.taskRef : (typeof m.taskRef === "string" ? m.taskRef : "");
  const title =
    typeof promptObj.title === "string" && promptObj.title
      ? promptObj.title
      : matchPromptTitle(m);
  const answers = m.answers && typeof m.answers === "object" && !Array.isArray(m.answers) ? m.answers : {};
  const votes = Array.isArray(m.votes) ? m.votes : [];
  return {
    id: m.id,
    seed: m.seed,
    status: m.status,
    sides,
    prompt: { promptId, taskRef, title },
    promptTitle: title,
    promptId,
    taskRef,
    answers,
    votes,
    verdict: m.verdict || null,
    winner: matchWinner(m),
    eloDelta: m.eloDelta || null,
    createdAt: m.createdAt,
  };
}

function buildArenaLeaderboard(matches, ratings) {
  const stats = new Map();
  function ensure(model) {
    if (!stats.has(model)) stats.set(model, { wins: 0, losses: 0, draws: 0 });
    return stats.get(model);
  }
  const list = Array.isArray(matches) ? matches : [];
  for (const m of list) {
    if (!m || typeof m !== "object") continue;
    const w = matchWinner(m);
    if (w !== "A" && w !== "B" && w !== "draw") continue;
    const ma = m.sides && m.sides.A && typeof m.sides.A.model === "string" ? m.sides.A.model : "";
    const mb = m.sides && m.sides.B && typeof m.sides.B.model === "string" ? m.sides.B.model : "";
    if (!ma || !mb) continue;
    const a = ensure(ma);
    const b = ensure(mb);
    if (w === "A") {
      a.wins += 1;
      b.losses += 1;
    } else if (w === "B") {
      b.wins += 1;
      a.losses += 1;
    } else {
      a.draws += 1;
      b.draws += 1;
    }
  }
  if (ratings && typeof ratings === "object" && !Array.isArray(ratings)) {
    for (const k of Object.keys(ratings)) {
      if (typeof k === "string" && k) ensure(k);
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

function serveStatic(req, res, pathname) {
  let rel = pathname === "/" ? "/index.html" : pathname;
  try {
    rel = decodeURIComponent(rel);
  } catch (_) {
    return sendError(res, 400, "bad path");
  }
  // Normalize and block traversal.
  const normalized = path.posix.normalize(rel);
  if (normalized.includes("..") || path.isAbsolute(normalized) && false) {
    return sendError(res, 400, "bad path");
  }
  const stripped = normalized.replace(/^\/+/, "");
  if (stripped.includes("..") || stripped.startsWith("~")) {
    return sendError(res, 400, "bad path");
  }
  const abs = path.join(PUBLIC_DIR, stripped);
  const resolvedPublic = path.resolve(PUBLIC_DIR);
  const resolvedAbs = path.resolve(abs);
  if (resolvedAbs !== resolvedPublic && !resolvedAbs.startsWith(resolvedPublic + path.sep)) {
    return sendError(res, 400, "bad path");
  }
  fs.stat(resolvedAbs, (err, st) => {
    if (err || !st.isFile()) {
      // Fall through: directory -> try index.html
      if (!err && st.isDirectory()) {
        const idx = path.join(resolvedAbs, "index.html");
        fs.readFile(idx, (e2, buf2) => {
          if (e2) return sendError(res, 404, "not found");
          setCors(res);
          res.writeHead(200, { "Content-Type": MIME[".html"] });
          res.end(buf2);
        });
        return;
      }
      return sendError(res, 404, "not found");
    }
    const ext = path.extname(resolvedAbs).toLowerCase();
    const type = MIME[ext] || "application/octet-stream";
    fs.readFile(resolvedAbs, (e, buf) => {
      if (e) return sendError(res, 404, "not found");
      setCors(res);
      res.writeHead(200, { "Content-Type": type });
      res.end(buf);
    });
  });
}

async function handle(req, res) {
  const u = new URL(req.url || "/", `http://${HOST}:${PORT}`);
  const pathname = u.pathname || "/";
  const method = (req.method || "GET").toUpperCase();

  // CORS preflight.
  if (method === "OPTIONS") {
    setCors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  // --- API: GET /api/health ---
  if (pathname === "/api/health" && method === "GET") {
    return sendJson(res, 200, { ok: true, version: VERSION });
  }

  // --- API: GET /api/models ---
  if (pathname === "/api/models" && method === "GET") {
    try {
      const raw = fs.readFileSync(MODELS_FILE, "utf8");
      const data = JSON.parse(raw);
      return sendJson(res, 200, data);
    } catch (e) {
      if (e && e.code === "ENOENT") return sendJson(res, 200, { models: [] });
      return sendError(res, 500, "failed to read models");
    }
  }

  // --- API: GET /api/tasks?suite= ---
  if (pathname === "/api/tasks" && method === "GET") {
    const suite = u.searchParams.get("suite") || "";
    if (!suite) {
      // No suite param: list available suites (convenience; spec requires ?suite=).
      const suites = listSuites();
      return sendJson(res, 400, { error: "missing ?suite= query param", suites });
    }
    const dir = resolveSuiteDir(suite);
    if (!dir) return sendError(res, 404, `suite not found: ${suite}`);
    const entries = readSuiteTasks(dir);
    const tasks = entries.map(taskSummary).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    return sendJson(res, 200, { suite, tasks });
  }

  // --- API: POST /api/runs[?mock=1] ---
  if (pathname === "/api/runs" && method === "POST") {
    let body;
    try {
      body = await parseJsonBody(req);
    } catch (e) {
      return sendError(res, 400, e.message || "invalid JSON body");
    }
    const model = body && typeof body.model === "string" ? body.model.trim() : "";
    const suite = body && typeof body.suite === "string" ? body.suite.trim() : "";
    const bodyMode = body && typeof body.mode === "string" ? body.mode.trim().toLowerCase() : "";
    if (!model) return sendError(res, 400, "missing required field: model");
    if (!suite) return sendError(res, 400, "missing required field: suite");

    const dir = resolveSuiteDir(suite);
    if (!dir) return sendError(res, 404, `suite not found: ${suite}`);

    const qmock = (u.searchParams.get("mock") || "").toLowerCase();
    const isMock =
      qmock === "1" || qmock === "true" || bodyMode === "mock" || body.mock === true || body.mock === 1;

    const entries = readSuiteTasks(dir);
    const startedAt = new Date().toISOString();
    const results = entries.map((entry) => {
      const s = taskSummary(entry);
      if (isMock) {
        return {
          taskId: s.id,
          pass: true,
          score01: 1,
          durationMs: 0,
          log: `mock stub PASS ${s.id} (no real agent executed)`,
        };
      }
      return {
        taskId: s.id,
        pass: false,
        score01: 0,
        durationMs: 0,
        log: "Use CLI live run",
      };
    });

    // Weighted avgScore by points; passRate unweighted.
    let totalPoints = 0;
    let earnedPoints = 0;
    entries.forEach((entry, i) => {
      const s = taskSummary(entry);
      const p = typeof s.points === "number" && Number.isFinite(s.points) && s.points > 0 ? s.points : 1;
      totalPoints += p;
      if (results[i] && results[i].pass) earnedPoints += p;
    });
    const avgScore = results.length === 0 || totalPoints === 0 ? 0 : earnedPoints / totalPoints;
    const passRate = results.length === 0 ? 0 : results.filter((r) => r.pass).length / results.length;
    const finishedAt = new Date().toISOString();

    const runId =
      "run-" + Date.now().toString(36) + "-" + Math.random().toString(16).slice(2, 8);
    const mode = isMock ? "mock" : bodyMode === "live" ? "live" : bodyMode === "mock" ? "mock" : isMock ? "mock" : "live";
    const demo = body && typeof body.demo === "boolean" ? body.demo : isMock;

    const run = {
      id: runId,
      model,
      suite,
      mode,
      status: "completed",
      results,
      avgScore,
      passRate,
      startedAt,
      finishedAt,
      demo,
      methodologyVersion: "v1",
    };

    try {
      fs.mkdirSync(RESULTS_DIR, { recursive: true });
      fs.writeFileSync(path.join(RESULTS_DIR, runId + ".json"), JSON.stringify(run, null, 2) + "\n", "utf8");
    } catch (e) {
      return sendError(res, 500, "failed to persist run");
    }
    return sendJson(res, 201, run);
  }

  // --- API: GET /api/runs (list) ---
  if (pathname === "/api/runs" && method === "GET") {
    const files = readResultsFiles();
    const runs = files
      .map((f) => runSummary(f.data))
      .filter((s) => typeof s.id === "string" && s.id)
      .sort((a, b) => {
        const ta = a.startedAt || a.finishedAt || "";
        const tb = b.startedAt || b.finishedAt || "";
        if (ta === tb) return a.id < b.id ? 1 : -1;
        return ta < tb ? 1 : -1; // newest first
      });
    return sendJson(res, 200, { runs });
  }

  // --- API: GET /api/runs/:id ---
  if (pathname.startsWith("/api/runs/") && method === "GET") {
    const id = pathname.slice("/api/runs/".length).split("/")[0];
    if (!id || !isSafeName(id)) return sendError(res, 404, "run not found");
    const fp = path.join(RESULTS_DIR, id + ".json");
    const resolvedResults = path.resolve(RESULTS_DIR);
    const resolvedFp = path.resolve(fp);
    if (!resolvedFp.startsWith(resolvedResults + path.sep)) return sendError(res, 404, "run not found");
    try {
      const raw = fs.readFileSync(fp, "utf8");
      const data = JSON.parse(raw);
      return sendJson(res, 200, data);
    } catch (e) {
      if (e && e.code === "ENOENT") return sendError(res, 404, "run not found");
      return sendError(res, 500, "failed to read run");
    }
  }

  // --- API: GET /api/prompts (summaries, newest first) ---
  if (pathname === "/api/prompts" && method === "GET") {
    const prompts = loadPrompts();
    const out = prompts
      .filter((p) => p && typeof p.id === "string" && p.id)
      .sort(newestFirst)
      .map(promptSummary);
    return sendJson(res, 200, { prompts: out });
  }

  // --- API: POST /api/prompts ---
  if (pathname === "/api/prompts" && method === "POST") {
    let body;
    try {
      body = await parseJsonBody(req);
    } catch (e) {
      return sendError(res, 400, e.message || "invalid JSON body");
    }
    const title = body && typeof body.title === "string" ? body.title.trim() : "";
    const rawBody = body && typeof body.body === "string" ? body.body : "";
    if (!title) return sendError(res, 400, "missing required field: title");
    if (!rawBody.trim()) return sendError(res, 400, "missing required field: body");
    const tags = normalizeTags(body.tags);
    const prompts = loadPrompts();
    const prompt = {
      id: nextSeqId("p", prompts),
      title,
      body: rawBody,
      tags,
      createdAt: new Date().toISOString(),
    };
    prompts.push(prompt);
    try {
      writeJsonAtomic(PROMPTS_FILE, prompts);
    } catch (e) {
      return sendError(res, 500, "failed to persist prompt");
    }
    return sendJson(res, 201, prompt);
  }

  // --- API: GET /api/prompts/:id ---
  if (pathname.startsWith("/api/prompts/") && method === "GET") {
    const id = pathname.slice("/api/prompts/".length).split("/")[0];
    if (!id || !isSafeName(id)) return sendError(res, 404, "prompt not found");
    const prompts = loadPrompts();
    const prompt = prompts.find((p) => p && p.id === id);
    if (!prompt) return sendError(res, 404, "prompt not found");
    const scores = loadScores()
      .filter((s) => s && s.promptId === id)
      .sort(newestFirst);
    return sendJson(res, 200, { prompt, scores });
  }

  // --- API: GET /api/scores?prompt=<id>&model=<id> ---
  if (pathname === "/api/scores" && method === "GET") {
    const qPrompt = u.searchParams.get("prompt") || "";
    const qModel = u.searchParams.get("model") || "";
    const scores = loadScores()
      .filter((s) => {
        if (!s || typeof s.id !== "string") return false;
        if (qPrompt && s.promptId !== qPrompt) return false;
        if (qModel && s.model !== qModel) return false;
        return true;
      })
      .sort(newestFirst);
    return sendJson(res, 200, { scores });
  }

  // --- API: POST /api/scores ---
  if (pathname === "/api/scores" && method === "POST") {
    let body;
    try {
      body = await parseJsonBody(req);
    } catch (e) {
      return sendError(res, 400, e.message || "invalid JSON body");
    }
    const promptId = body && typeof body.promptId === "string" ? body.promptId.trim() : "";
    const model = body && typeof body.model === "string" ? body.model.trim() : "";
    const answer = body && typeof body.answer === "string" ? body.answer : "";
    const score01Raw = body ? body.score01 : undefined;
    const notes = body && typeof body.notes === "string" ? body.notes : "";
    if (!promptId) return sendError(res, 400, "missing required field: promptId");
    if (!model) return sendError(res, 400, "missing required field: model");
    if (typeof score01Raw !== "number" || !Number.isFinite(score01Raw)) {
      return sendError(res, 400, "score01 must be a number");
    }
    const prompts = loadPrompts();
    const prompt = prompts.find((p) => p && p.id === promptId);
    if (!prompt) return sendError(res, 404, "prompt not found");
    const scores = loadScores();
    const entry = {
      id: nextSeqId("s", scores),
      promptId,
      model,
      answer,
      score01: clamp01(score01Raw),
      notes,
      createdAt: new Date().toISOString(),
    };
    scores.push(entry);
    try {
      writeJsonAtomic(SCORES_FILE, scores);
    } catch (e) {
      return sendError(res, 500, "failed to persist score");
    }
    return sendJson(res, 201, entry);
  }

  // --- API: POST /api/matches ---
  if (pathname === "/api/matches" && method === "POST") {
    let body;
    try {
      body = await parseJsonBody(req);
    } catch (e) {
      return sendError(res, 400, e.message || "invalid JSON body");
    }
    const modelA = body && typeof body.modelA === "string" ? body.modelA.trim() : "";
    const modelB = body && typeof body.modelB === "string" ? body.modelB.trim() : "";
    if (!modelA) return sendError(res, 400, "missing required field: modelA");
    if (!modelB) return sendError(res, 400, "missing required field: modelB");
    if (modelA === modelB) return sendError(res, 400, "modelA and modelB must differ");
    const promptId = body && typeof body.promptId === "string" ? body.promptId.trim() : "";
    const taskRef = body && typeof body.taskRef === "string" ? body.taskRef.trim() : "";
    let seed = body && typeof body.seed === "string" ? body.seed.trim() : "";
    if (!seed) seed = randomHex(16);
    const title = resolveArenaPromptTitle(promptId, taskRef);
    const matches = loadMatches();
    const id = nextSeqId("m", matches);
    const createdAt = new Date().toISOString();
    const match = {
      id,
      seed,
      status: "open",
      sides: { A: { model: modelA, label: "A" }, B: { model: modelB, label: "B" } },
      prompt: { promptId, taskRef, title },
      promptTitle: title,
      promptId,
      taskRef,
      answers: {},
      votes: [],
      verdict: null,
      winner: null,
      eloDelta: null,
      createdAt,
    };
    matches.push(match);
    try {
      saveMatches(matches);
    } catch (e) {
      return sendError(res, 500, "failed to persist match");
    }
    return sendJson(res, 201, publicMatch(match, false));
  }

  // --- API: GET /api/matches (summaries, newest first; no answers, no models) ---
  if (pathname === "/api/matches" && method === "GET") {
    const matches = loadMatches();
    const out = matches
      .filter((m) => m && typeof m.id === "string" && m.id)
      .sort(newestFirst)
      .map((m) => ({
        id: m.id,
        status: m.status,
        winner: matchWinner(m),
        promptTitle: matchPromptTitle(m),
        createdAt: m.createdAt,
      }));
    return sendJson(res, 200, { matches: out });
  }

  // --- API: /api/matches/:id (+ /answers, /votes) ---
  if (pathname.startsWith("/api/matches/") && (method === "GET" || method === "POST")) {
    const rest = pathname.slice("/api/matches/".length);
    const segs = rest.split("/");
    const id = segs[0] || "";
    const sub = segs[1] || "";
    const extra = segs.slice(2).filter((s) => s.length > 0);
    if (!id || !isSafeName(id)) return sendError(res, 404, "match not found");

    // --- API: POST /api/matches/:id/answers ---
    if (sub === "answers" && method === "POST" && extra.length === 0) {
      let body;
      try {
        body = await parseJsonBody(req);
      } catch (e) {
        return sendError(res, 400, e.message || "invalid JSON body");
      }
      const matches = loadMatches();
      const match = matches.find((m) => m && m.id === id);
      if (!match) return sendError(res, 404, "match not found");
      if (isMatchDecided(match)) return sendError(res, 409, "verdict already set");
      const side = body && typeof body.side === "string" ? body.side : "";
      const text = body && typeof body.text === "string" ? body.text : "";
      if (side !== "A" && side !== "B") return sendError(res, 400, "side must be A or B");
      if (!text.trim()) return sendError(res, 400, "missing required field: text");
      if (!match.answers || typeof match.answers !== "object" || Array.isArray(match.answers)) {
        match.answers = {};
      }
      match.answers[side] = text;
      try {
        saveMatches(matches);
      } catch (e) {
        return sendError(res, 500, "failed to persist match");
      }
      return sendJson(res, 201, { id: match.id, matchId: match.id, side, text });
    }

    // --- API: POST /api/matches/:id/votes ---
    if (sub === "votes" && method === "POST" && extra.length === 0) {
      let body;
      try {
        body = await parseJsonBody(req);
      } catch (e) {
        return sendError(res, 400, e.message || "invalid JSON body");
      }
      const matches = loadMatches();
      const match = matches.find((m) => m && m.id === id);
      if (!match) return sendError(res, 404, "match not found");
      if (isMatchDecided(match)) return sendError(res, 409, "verdict already set");
      const judge = body && typeof body.judge === "string" ? body.judge.trim() : "";
      const side = body && typeof body.side === "string" ? body.side : "";
      if (!judge) return sendError(res, 400, "missing required field: judge");
      if (side !== "A" && side !== "B" && side !== "draw") {
        return sendError(res, 400, "side must be A, B, or draw");
      }
      if (!Array.isArray(match.votes)) match.votes = [];
      const vote = { judge, side, createdAt: new Date().toISOString() };
      match.votes.push(vote);
      // Finalize when 3 votes total OR any side reaches 2.
      let countA = 0;
      let countB = 0;
      let countDraw = 0;
      for (const v of match.votes) {
        if (!v || typeof v.side !== "string") continue;
        if (v.side === "A") countA += 1;
        else if (v.side === "B") countB += 1;
        else if (v.side === "draw") countDraw += 1;
      }
      if (countA >= 2 || countB >= 2 || match.votes.length >= 3) {
        let winner = "draw";
        if (countA > countB && countA > countDraw) winner = "A";
        else if (countB > countA && countB > countDraw) winner = "B";
        const modelA =
          match.sides && match.sides.A && typeof match.sides.A.model === "string"
            ? match.sides.A.model
            : "";
        const modelB =
          match.sides && match.sides.B && typeof match.sides.B.model === "string"
            ? match.sides.B.model
            : "";
        const ratings = loadRatings();
        const ra = getRating(ratings, modelA);
        const rb = getRating(ratings, modelB);
        const scoreA = winner === "A" ? 1 : winner === "B" ? 0 : 0.5;
        const ea = 1 / (1 + Math.pow(10, (rb - ra) / 400));
        const eb = 1 - ea;
        const newA = Math.round(ra + ARENA_K * (scoreA - ea));
        const newB = Math.round(rb + ARENA_K * ((1 - scoreA) - eb));
        const eloDelta = { A: newA - ra, B: newB - rb };
        if (modelA) setRating(ratings, modelA, newA);
        if (modelB) setRating(ratings, modelB, newB);
        match.status = "verdict";
        match.winner = winner;
        match.verdict = {
          winner,
          counts: { A: countA, B: countB, draw: countDraw },
          eloDelta,
          decidedAt: new Date().toISOString(),
        };
        match.eloDelta = eloDelta;
        try {
          saveRatings(ratings);
        } catch (e) {
          return sendError(res, 500, "failed to persist ratings");
        }
      }
      try {
        saveMatches(matches);
      } catch (e) {
        return sendError(res, 500, "failed to persist match");
      }
      return sendJson(res, 201, vote);
    }

    // --- API: GET /api/matches/:id (full; hide models while open unless ?reveal=1) ---
    if (sub === "" && method === "GET" && extra.length === 0) {
      const matches = loadMatches();
      const match = matches.find((m) => m && m.id === id);
      if (!match) return sendError(res, 404, "match not found");
      const reveal = u.searchParams.get("reveal") === "1";
      return sendJson(res, 200, publicMatch(match, reveal));
    }

    return sendError(res, 404, "not found");
  }

  // --- API: GET /api/leaderboard ---
  if (pathname === "/api/leaderboard" && method === "GET") {
    const files = readResultsFiles();
    const byModel = new Map();
    for (const f of files) {
      const d = f.data || {};
      if (typeof d.model !== "string" || !d.model) continue;
      const avg = typeof d.avgScore === "number" && Number.isFinite(d.avgScore) ? d.avgScore : 0;
      const pr = typeof d.passRate === "number" && Number.isFinite(d.passRate) ? d.passRate : 0;
      const fin = d.finishedAt || d.startedAt || "";
      if (!byModel.has(d.model)) byModel.set(d.model, { runs: 0, avgSum: 0, prSum: 0, demoRuns: 0, latest: "" });
      const agg = byModel.get(d.model);
      agg.runs += 1;
      agg.avgSum += avg;
      agg.prSum += pr;
      if (d.demo === true) agg.demoRuns += 1;
      if (fin && fin > agg.latest) agg.latest = fin;
    }
    const leaderboard = [...byModel.entries()]
      .map(([model, agg]) => ({
        model,
        runs: agg.runs,
        avgScore: agg.runs ? agg.avgSum / agg.runs : 0,
        passRate: agg.runs ? agg.prSum / agg.runs : 0,
        demo: agg.demoRuns === agg.runs && agg.runs > 0, // true when all runs for model are demo
        demoRuns: agg.demoRuns,
      }))
      .sort((a, b) => {
        if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
        if (b.passRate !== a.passRate) return b.passRate - a.passRate;
        return a.model < b.model ? -1 : 1;
      });
    const manual = buildManualLeaderboard(loadScores());
    let arena = [];
    try {
      arena = buildArenaLeaderboard(loadMatches(), loadRatings());
    } catch (_) {
      arena = [];
    }
    return sendJson(res, 200, { leaderboard, manual, arena });
  }

  // --- Static: anything else not under /api/* ---
  if (!pathname.startsWith("/api/")) {
    if (method !== "GET" && method !== "HEAD") return sendError(res, 404, "not found");
    if (method === "HEAD") {
      setCors(res);
      res.writeHead(200, { "Content-Type": "application/octet-stream" });
      res.end();
      return;
    }
    return serveStatic(req, res, pathname);
  }

  // --- Unknown API route -> JSON 404 ---
  return sendError(res, 404, "not found");
}

const server = http.createServer((req, res) => {
  handle(req, res).catch(() => {
    try {
      sendError(res, 500, "internal error");
    } catch (_) {}
  });
});

server.on("clientError", (err, socket) => {
  try {
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  } catch (_) {}
});

server.listen(PORT, HOST, () => {
  console.log(`BDX Bench server listening on http://${HOST}:${PORT}`);
});
