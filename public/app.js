'use strict';
/* BDX Bench dashboard - zero-dep vanilla JS. No secrets handled here. */
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const state = { cache: {}, views: 0, globalQ: '' };
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

async function getJSON(url) {
  const r = await fetch(url);
  const t = await r.text();
  try { return { status: r.status, json: JSON.parse(t) }; }
  catch { return { status: r.status, json: { raw: t.slice(0, 2000) } }; }
}

function matchQ(row) {
  if (!state.globalQ) return true;
  const q = state.globalQ.toLowerCase();
  return Object.values(row).some((v) => String(v == null ? '' : v).toLowerCase().includes(q));
}

function makeTable(el, opts) {
  // opts: {cols:[{key,label,num,fmt}], rows:[obj], pageSize}
  state.views++;
  const wrap = document.createElement('div');
  const tools = document.createElement('div');
  tools.className = 'tbltools';
  const f = document.createElement('input');
  f.type = 'search'; f.placeholder = 'Filter table…'; f.setAttribute('aria-label', 'Filter table');
  const per = document.createElement('select');
  [10, 25, 50, 100].forEach((n) => { const o = document.createElement('option'); o.value = n; o.textContent = n + '/page'; if (n === (opts.pageSize || 10)) o.selected = true; per.appendChild(o); });
  const csv = document.createElement('button');
  csv.type = 'button'; csv.className = 'ghost'; csv.textContent = 'CSV';
  const info = document.createElement('span');
  info.className = 'muted';
  tools.append(f, per, csv, info);
  const tbl = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');
  tbl.append(thead, tbody);
  const pager = document.createElement('div');
  pager.className = 'pager';
  const prev = document.createElement('button'); prev.type = 'button'; prev.className = 'ghost'; prev.textContent = '‹';
  const next = document.createElement('button'); next.type = 'button'; next.className = 'ghost'; next.textContent = '›';
  const pg = document.createElement('span');
  pager.append(prev, pg, next);
  wrap.append(tools, tbl, pager);
  el.innerHTML = '';
  el.appendChild(wrap);

  let sortKey = null, sortDir = 1, page = 0;
  function rows() {
    let r = (opts.rows || []).filter(matchQ);
    const q = f.value.trim().toLowerCase();
    if (q) r = r.filter((row) => Object.values(row).some((v) => String(v == null ? '' : v).toLowerCase().includes(q)));
    if (sortKey) r = r.slice().sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      const an = parseFloat(av), bn = parseFloat(bv);
      if (Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * sortDir;
      return String(av == null ? '' : av).localeCompare(String(bv == null ? '' : bv)) * sortDir;
    });
    return r;
  }
  function render() {
    const cols = opts.cols;
    thead.innerHTML = '<tr>' + cols.map((c) => `<th data-k="${esc(c.key)}">${esc(c.label)}${sortKey === c.key ? (sortDir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('') + '</tr>';
    $$('th', thead).forEach((th) => th.addEventListener('click', () => {
      const k = th.getAttribute('data-k');
      if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; }
      page = 0; render();
    }));
    const all = rows();
    const size = parseInt(per.value, 10) || 10;
    const pages = Math.max(1, Math.ceil(all.length / size));
    page = Math.min(page, pages - 1);
    const slice = all.slice(page * size, page * size + size);
    tbody.innerHTML = slice.map((row) => '<tr>' + cols.map((c) => {
      let v = row[c.key];
      if (c.fmt) v = c.fmt(v, row);
      else v = esc(typeof v === 'number' ? (Math.round(v * 10000) / 10000) : v);
      return `<td>${v}</td>`;
    }).join('') + '</tr>').join('') || `<tr><td colspan="${cols.length}" class="muted">No rows</td></tr>`;
    info.textContent = `${all.length} rows`;
    pg.textContent = `Page ${page + 1}/${pages}`;
    updateCount();
  }
  f.addEventListener('input', () => { page = 0; render(); });
  per.addEventListener('change', () => { page = 0; render(); });
  prev.addEventListener('click', () => { page = Math.max(0, page - 1); render(); });
  next.addEventListener('click', () => { page++; render(); });
  csv.addEventListener('click', () => {
    const cols = opts.cols;
    const all = rows();
    const lines = [cols.map((c) => JSON.stringify(c.label)).join(',')];
    all.forEach((row) => lines.push(cols.map((c) => JSON.stringify(row[c.key] == null ? '' : row[c.key])).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (opts.name || 'table') + '.csv';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  });
  render();
  return { rerender: render };
}

function setTabs(section, tabs, renderFn) {
  const bar = document.querySelector(`[data-tabs="${section}"]`);
  const body = document.getElementById(section + 'Body') || document.getElementById(section === 'openrouter' ? 'openrouterBody' : section + 'Body');
  bar.innerHTML = '';
  tabs.forEach((t, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = t; if (i === 0) b.classList.add('active');
    b.addEventListener('click', () => { $$('button', bar).forEach((x) => x.classList.remove('active')); b.classList.add('active'); renderFn(t, body); });
    bar.appendChild(b);
  });
  renderFn(tabs[0], body);
}

function updateCount() {
  const el = $('#tableCount');
  if (el) el.textContent = state.views + ' interactive views';
  const vc = $('#viewCount');
  if (vc) vc.textContent = `· ${state.views} interactive tables & views`;
}

function barChart(canvas, labels, values, color) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!values.length) { ctx.fillStyle = '#8b949e'; ctx.fillText('No data', 10, 20); return; }
  const max = Math.max.apply(null, values.concat([1]));
  const bw = Math.max(8, (W - 20) / values.length - 8);
  values.forEach((v, i) => {
    const h = Math.max(2, ((v / max) * (H - 50)));
    const x = 10 + i * (bw + 8);
    ctx.fillStyle = color || '#2f81f7';
    ctx.fillRect(x, H - 30 - h, bw, h);
    ctx.fillStyle = '#e6edf3';
    ctx.font = '10px system-ui';
    const lab = String(labels[i] || '').slice(0, 12);
    ctx.fillText(lab, x, H - 16);
    ctx.fillText(String(Math.round(v * 100) / 100), x, H - 34 - h);
  });
}

async function refresh() {
  const [health, models, board, runs, prompts] = await Promise.all([
    getJSON('/api/health'), getJSON('/api/models'), getJSON('/api/leaderboard'),
    getJSON('/api/runs'), getJSON('/api/prompts')
  ]);
  state.cache = { health, models, board, runs, prompts };
  const hd = $('#healthDot'), ht = $('#healthText');
  if (health.status === 200) { hd.classList.add('ok'); ht.textContent = 'live · ' + JSON.stringify(health.json).slice(0, 80); }
  else { ht.textContent = 'unreachable'; }
  $('#updatedAt').textContent = 'updated ' + new Date().toLocaleTimeString();

  const lb = board.json || {};
  const auto = lb.leaderboard || [], manual = lb.manual || [], arena = lb.arena || [];
  const bestAuto = auto.slice().sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))[0];
  const bestMan = manual.slice().sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))[0];
  const bestArena = arena.slice().sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];
  $('#highlights').innerHTML = [
    ['Best auto', bestAuto ? esc(bestAuto.model) + ' · ' + Number(bestAuto.avgScore || 0).toFixed(3) : '—'],
    ['Best manual', bestMan ? esc(bestMan.model) + ' · ' + Number(bestMan.avgScore || 0).toFixed(3) : '—'],
    ['Arena leader', bestArena ? esc(bestArena.model) + ' · ' + esc(bestArena.rating) : '—'],
    ['Runs', String((runs.json.runs || []).length)],
    ['Prompts', String((prompts.json.prompts || []).length)],
  ].map(([k, v]) => `<div class="card"><span class="muted">${esc(k)}</span><b>${v}</b></div>`).join('');

  buildIntelligence(auto, runs.json.runs || []);
  buildManual(manual);
  buildArena(arena);
  buildModels(models.json);
  buildTasks();
  buildRuns(runs.json.runs || []);
  buildPrompts(prompts.json.prompts || []);
  buildOpenRouter();
  updateCount();
}

function buildIntelligence(auto, runs) {
  const suites = Array.from(new Set(runs.map((r) => r.suite).filter(Boolean)));
  const models = Array.from(new Set(auto.map((a) => a.model).filter(Boolean)));
  const tabs = ['All', 'Top 5', 'Mock only', 'By suite'].concat(suites.map((s) => 'Suite: ' + s)).concat(models.slice(0, 12).map((m) => 'Model: ' + m)).concat(['By mode']);
  setTabs('intelligence', tabs, (t, body) => {
    let rows = auto;
    if (t === 'Top 5') rows = auto.slice().sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0)).slice(0, 5);
    else if (t === 'Mock only') rows = runs.filter((r) => r.demo).map((r) => ({ model: r.model, suite: r.suite, avgScore: r.avgScore, passRate: r.passRate, runId: r.id, finishedAt: r.finishedAt, mode: r.mode }));
    else if (t === 'By suite') rows = suites.flatMap((s) => runs.filter((r) => r.suite === s).map((r) => ({ suite: s, model: r.model, avgScore: r.avgScore, passRate: r.passRate, runId: r.id })));
    else if (t.startsWith('Suite: ')) { const s = t.slice(7); rows = runs.filter((r) => r.suite === s); }
    else if (t.startsWith('Model: ')) { const m = t.slice(7); rows = auto.filter((a) => a.model === m); if (!rows.length) rows = runs.filter((r) => r.model === m); }
    else if (t === 'By mode') rows = runs.map((r) => ({ model: r.model, suite: r.suite, mode: r.mode, avgScore: r.avgScore, passRate: r.passRate, demo: r.demo }));
    const cols = Object.keys(rows[0] || { model: '', avgScore: '', passRate: '' }).map((k) => ({ key: k, label: k }));
    makeTable(body, { name: 'intelligence-' + t, cols, rows });
  });
  const top = auto.slice().sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0)).slice(0, 12);
  barChart($('#chartAuto'), top.map((a) => (a.model || '').split('/').pop()), top.map((a) => a.avgScore || 0), '#3fb950');
}

async function buildManual(manual) {
  const p001 = await getJSON('/api/scores?prompt=p-001');
  const scores = p001.json.scores || [];
  const tabs = ['Board', 'p-001 scores', 'By model', 'Needs vote'];
  setTabs('manual', tabs, (t, body) => {
    if (t === 'Board') makeTable(body, { name: 'manual-board', cols: ['model', 'entries', 'avgScore', 'lastScore'].map((k) => ({ key: k, label: k })), rows: manual });
    else if (t === 'p-001 scores') makeTable(body, { name: 'manual-p001', cols: [{ key: 'model', label: 'model' }, { key: 'score01', label: 'score01' }, { key: 'id', label: 'id' }, { key: 'createdAt', label: 'createdAt' }, { key: 'notes', label: 'notes' }], rows: scores });
    else if (t === 'By model') {
      const ms = Array.from(new Set(scores.map((s) => s.model)));
      makeTable(body, { name: 'manual-bymodel', cols: [{ key: 'model', label: 'model' }, { key: 'n', label: 'answers' }, { key: 'avg', label: 'avg score01' }], rows: ms.map((m) => { const ss = scores.filter((s) => s.model === m); return { model: m, n: ss.length, avg: ss.reduce((a, s) => a + (s.score01 || 0), 0) / Math.max(1, ss.length) }; }) });
    } else makeTable(body, { name: 'manual-needsvote', cols: [{ key: 'model', label: 'model' }, { key: 'hint', label: 'hint' }], rows: manual.map((m) => ({ model: m.model, hint: 'open arena match vs baseline, vote in Arena tab' })) });
  });
}

async function buildArena(arena) {
  const m = await getJSON('/api/matches');
  const matches = m.json.matches || [];
  const open = matches.filter((x) => x.status === 'open');
  const done = matches.filter((x) => x.status !== 'open');
  setTabs('arena', ['Ratings', 'Open matches', 'Decided', 'Vote'], (t, body) => {
    if (t === 'Ratings') {
      makeTable(body, { name: 'arena-ratings', cols: [{ key: 'model', label: 'model' }, { key: 'rating', label: 'elo' }, { key: 'wins', label: 'wins' }, { key: 'losses', label: 'losses' }], rows: arena });
      barChart($('#chartArena'), arena.slice(0, 12).map((a) => String(a.model || '').split('/').pop()), arena.slice(0, 12).map((a) => a.rating || 1000), '#2f81f7');
    } else if (t === 'Open matches') {
      body.innerHTML = open.slice(0, 20).map((x) => `<details><summary>${esc(x.id)} · ${esc(x.promptTitle || x.promptId || '')} · votes ${(x.votes || []).length}</summary><pre>${esc(JSON.stringify({ answers: x.answers || {}, votes: x.votes || [] }, null, 2)).slice(0, 3000)}</pre><div class="tbltools"><input placeholder="judge name" data-j="${esc(x.id)}"><button class="ghost" data-v="A" data-id="${esc(x.id)}">Vote A</button><button class="ghost" data-v="B" data-id="${esc(x.id)}">Vote B</button><button class="ghost" data-v="draw" data-id="${esc(x.id)}">Draw</button> <a href="/api/matches/${esc(x.id)}?reveal=1" target="_blank" rel="noopener">reveal</a></div></details>`).join('') || '<p class="muted">No open matches — bulk free-model job creates them as answers land.</p>';
      $$('button[data-v]', body).forEach((b) => b.addEventListener('click', async () => {
        const id = b.getAttribute('data-id');
        const judge = ($(`input[data-j="${id}"]`, body) || {}).value || 'web-judge';
        const side = b.getAttribute('data-v');
        const r = await fetch(`/api/matches/${encodeURIComponent(id)}/votes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ judge, side }) });
        alert('vote status ' + r.status);
        refresh();
      }));
    } else if (t === 'Decided') makeTable(body, { name: 'arena-decided', cols: [{ key: 'id', label: 'id' }, { key: 'winner', label: 'winner' }, { key: 'status', label: 'status' }], rows: done });
    else makeTable(body, { name: 'arena-all', cols: [{ key: 'id', label: 'id' }, { key: 'status', label: 'status' }, { key: 'promptId', label: 'prompt' }], rows: matches });
  });
}

function buildModels(modelsJson) {
  const list = (modelsJson && modelsJson.models) || [];
  setTabs('models', ['All BDX', 'By effort', 'max', 'xhigh', 'high', 'OpenRouter hint'], (t, body) => {
    let rows = list;
    if (t === 'By effort') rows = list.map((m) => ({ id: m.id, effort: m.effort || '', label: m.label || '' }));
    else if (['max', 'xhigh', 'high'].includes(t)) rows = list.filter((m) => (m.effort || '') === t);
    else if (t === 'OpenRouter hint') rows = [{ hint: 'See OpenRouter Free section below for live free catalog (public, no key).' }];
    const cols = Object.keys(rows[0] || { id: '' }).slice(0, 6).map((k) => ({ key: k, label: k }));
    makeTable(body, { name: 'models-' + t, cols, rows });
  });
}

async function buildTasks() {
  const [a, b] = await Promise.all([getJSON('/api/tasks?suite=swe-mini'), getJSON('/api/tasks?suite=terminal-mini')]);
  const swe = a.json.tasks || [], term = b.json.tasks || [];
  setTabs('tasks', ['swe-mini', 'terminal-mini', 'All', 'Points'], (t, body) => {
    let rows = t === 'swe-mini' ? swe : t === 'terminal-mini' ? term : swe.concat(term.map((x) => ({ ...x, suite: 'terminal-mini' })));
    if (t === 'Points') rows = [{ suite: 'swe-mini', tasks: swe.length }, { suite: 'terminal-mini', tasks: term.length }];
    const cols = Object.keys(rows[0] || { id: '' }).map((k) => ({ key: k, label: k }));
    makeTable(body, { name: 'tasks-' + t, cols, rows });
  });
}

function buildRuns(runs) {
  const models = Array.from(new Set(runs.map((r) => r.model))).slice(0, 10);
  const tabs = ['All', 'swe-mini', 'terminal-mini', 'mock', 'live'].concat(models.map((m) => 'Model: ' + m));
  setTabs('runs', tabs, (t, body) => {
    let rows = runs;
    if (t === 'swe-mini' || t === 'terminal-mini') rows = runs.filter((r) => r.suite === t);
    else if (t === 'mock' || t === 'live') rows = runs.filter((r) => r.mode === t);
    else if (t.startsWith('Model: ')) rows = runs.filter((r) => r.model === t.slice(7));
    makeTable(body, { name: 'runs-' + t, cols: [{ key: 'id', label: 'id' }, { key: 'model', label: 'model' }, { key: 'suite', label: 'suite' }, { key: 'mode', label: 'mode' }, { key: 'avgScore', label: 'avg' }, { key: 'passRate', label: 'pass' }, { key: 'finishedAt', label: 'finished' }], rows });
  });
}

async function buildPrompts(prompts) {
  setTabs('prompts', ['All', 'p-001 detail'], async (t, body) => {
    if (t === 'All') makeTable(body, { name: 'prompts-all', cols: [{ key: 'id', label: 'id' }, { key: 'title', label: 'title' }, { key: 'tags', label: 'tags' }], rows: prompts.map((p) => ({ ...p, tags: (p.tags || []).join(',') })) });
    else {
      const d = await getJSON('/api/prompts/p-001');
      body.innerHTML = `<details open><summary>p-001 body</summary><pre>${esc(d.json.prompt ? d.json.prompt.body : 'missing')}</pre></details>`;
      const host = document.createElement('div');
      body.appendChild(host);
      makeTable(host, { name: 'prompts-p001-scores', cols: [{ key: 'model', label: 'model' }, { key: 'score01', label: 'score' }, { key: 'id', label: 'id' }], rows: d.json.scores || [] });
    }
  });
}

async function buildOpenRouter() {
  let catalog = [];
  try {
    const r = await fetch('https://openrouter.ai/api/v1/models').then((x) => x.json());
    catalog = r.data || [];
  } catch { catalog = []; }
  const free = catalog.filter((m) => parseFloat((m.pricing || {}).prompt || '1') === 0 && parseFloat((m.pricing || {}).completion || '1') === 0 || String(m.id || '').endsWith(':free'));
  const buckets = { 'all free': free, 'ctx ≥ 1M': free.filter((m) => (m.context_length || 0) >= 1000000), '262K': free.filter((m) => (m.context_length || 0) === 262144), 'coding': free.filter((m) => /code|coder|laguna|north|deepseek|glm/i.test((m.id || '') + ' ' + (m.description || ''))), 'router': catalog.filter((m) => m.id === 'openrouter/free') };
  setTabs('openrouter', Object.keys(buckets).concat(['status']), (t, body) => {
    if (t === 'status') { body.innerHTML = `<p class="muted">Public catalog: ${catalog.length} models, ${free.length} free. Bulk flamethrower job posts arena matches live; refresh to see them. stealth/union-alpha is retired → unbiased/pareto.</p>`; return; }
    makeTable(body, { name: 'or-' + t, cols: [{ key: 'id', label: 'model' }, { key: 'context_length', label: 'ctx' }, { key: 'desc', label: 'description' }], rows: (buckets[t] || []).map((m) => ({ id: m.id, context_length: m.context_length, desc: String(m.description || '').slice(0, 120) })) });
  });
}

$('#refreshBtn').addEventListener('click', refresh);
$('#globalSearch').addEventListener('input', (e) => { state.globalQ = e.target.value; });
setInterval(() => { refresh().catch(() => {}); }, 30000);
refresh().catch(() => { $('#healthText').textContent = 'failed to load'; });
