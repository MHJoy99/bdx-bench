"use strict";
/* BDX Bench v0.1 GUI — vanilla JS, relative URLs, no deps. */
var $ = function (id) { return document.getElementById(id); };
var state = { runId: null, timer: null };
function fmt(x, d) { var n = Number(x); return isFinite(n) ? n.toFixed(d == null ? 2 : d) : "—"; }
function pct(x) { var n = Number(x); if (!isFinite(n)) return "—"; return Math.round(n * 100) + "%"; }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
function showErr(msg) { var e = $("error"); if (!msg) { e.hidden = true; e.textContent = ""; return; } e.hidden = false; e.textContent = msg; }
function setHealth(ok, txt) { $("health").textContent = txt; $("dot").className = "dot " + (ok ? "ok" : "bad"); }
function get(url) { return fetch(url, { headers: { accept: "application/json" } }).then(function (r) { if (!r.ok) throw new Error(url + " → HTTP " + r.status); return r.json(); }); }
function asModels(j) { if (Array.isArray(j)) return j; if (j && Array.isArray(j.models)) return j.models; return []; }
function asRuns(j) { if (Array.isArray(j)) return j; if (j && Array.isArray(j.runs)) return j.runs; return []; }
function asBoard(j) { if (Array.isArray(j)) return j; if (j && Array.isArray(j.leaderboard)) return j.leaderboard; if (j && Array.isArray(j.entries)) return j.entries; return []; }
function loadModels() {
  return get("api/models").then(function (j) {
    var ms = asModels(j), sel = $("model"), cur = sel.value;
    sel.textContent = "";
    if (!ms.length) { sel.appendChild(new Option("no models", "")); return; }
    ms.forEach(function (m) {
      var id = typeof m === "string" ? m : (m.id || m.model || "");
      var lb = typeof m === "string" ? m : (m.label || m.id || "");
      sel.appendChild(new Option(lb + (id !== lb ? " (" + id + ")" : ""), id));
    });
    if (cur) sel.value = cur;
  });
}
function bar(v) { var n = Number(v), w = isFinite(n) ? Math.max(0, Math.min(1, n)) * 100 : 0; return '<span class="bar"><i style="width:' + w.toFixed(1) + '%"></i></span>'; }
function loadBoard() {
  return get("api/leaderboard").then(function (j) {
    var rows = asBoard(j), tb = $("lb-body");
    if (!rows.length) { tb.innerHTML = '<tr><td colspan="5" class="muted">no runs yet — queue a mock run.</td></tr>'; return; }
    rows.sort(function (a, b) { return (Number(b.avgScore) || 0) - (Number(a.avgScore) || 0); });
    tb.innerHTML = rows.map(function (r) {
      var m = r.model || r.id || "?", n = r.runs != null ? r.runs : (r.total != null ? r.total : "—");
      var demo = r.demo ? '<span class="badge demo">demo</span>' : '<span class="badge">live</span>';
      return "<tr><td>" + esc(m) + "</td><td>" + esc(n) + "</td>" +
        '<td><span class="cell">' + bar(r.avgScore) + esc(fmt(r.avgScore)) + "</span></td>" +
        "<td>" + esc(pct(r.passRate != null ? r.passRate : r.avgScore)) + "</td><td>" + demo + "</td></tr>";
    }).join("");
  });
}
function loadRuns() {
  return get("api/runs").then(function (j) {
    var runs = asRuns(j), ul = $("runs");
    if (!runs.length) { ul.innerHTML = '<li class="muted">no runs yet.</li>'; return; }
    ul.textContent = "";
    runs.slice().reverse().forEach(function (r) {
      var li = document.createElement("li"), b = document.createElement("button");
      b.type = "button"; if (r.id === state.runId) b.className = "sel";
      var st = r.status || "", sc = r.avgScore != null ? " · score " + fmt(r.avgScore) : "";
      b.innerHTML = "<strong>" + esc(r.id || "?") + "</strong> <small>" + esc(r.model || "?") + " · " + esc(r.suite || "?") + " · " + esc(st) + esc(sc) + (r.demo ? " · demo" : "") + "</small>";
      b.onclick = function () { state.runId = r.id; loadDetail(); Array.prototype.forEach.call(ul.querySelectorAll("button"), function (x) { x.classList.remove("sel"); }); b.classList.add("sel"); };
      li.appendChild(b); ul.appendChild(li);
    });
  });
}
function loadDetail() {
  if (!state.runId) return Promise.resolve();
  return get("api/runs/" + encodeURIComponent(state.runId)).then(function (r) {
    var d = $("detail"), res = Array.isArray(r.results) ? r.results : [];
    var head = '<div class="kv"><span class="muted">id</span><span>' + esc(r.id) + '</span>' +
      '<span class="muted">model</span><span>' + esc(r.model) + '</span>' +
      '<span class="muted">suite</span><span>' + esc(r.suite) + " · " + esc(r.mode || "") + " · " + esc(r.status || "") + "</span>" +
      '<span class="muted">score</span><span>' + esc(fmt(r.avgScore)) + " · pass " + esc(pct(r.passRate)) + "</span></div>";
    if (!res.length) { d.innerHTML = head + '<p class="muted">no per-task results.</p>'; return; }
    d.innerHTML = head + '<table><thead><tr><th>Task</th><th>Result</th><th>Duration</th></tr></thead><tbody>' +
      res.map(function (t) {
        var ok = !!t.pass, ms = t.durationMs != null ? Math.round(t.durationMs) + " ms" : "—";
        return "<tr><td>" + esc(t.taskId || t.id || "?") + "</td>" +
          '<td class="' + (ok ? "pass" : "fail") + '">' + (ok ? "PASS" : "FAIL") + "</td><td>" + esc(ms) + "</td></tr>";
      }).join("") + "</tbody></table>";
  });
}
function queueRun() {
  var b = $("queue"), msg = $("qmsg"), m = $("model").value, s = $("suite").value;
  if (!m) { msg.textContent = "pick a model first"; return; }
  b.disabled = true; msg.textContent = "queueing…";
  fetch("api/runs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: m, suite: s, mode: "mock" }) })
    .then(function (r) { if (!r.ok) throw new Error("POST /api/runs → HTTP " + r.status); return r.json(); })
    .then(function (r) { msg.textContent = "queued " + (r.id || "(ok)"); if (r.id) state.runId = r.id; return refresh(true); })
    .catch(function (e) { msg.textContent = "queue failed"; showErr("Queue failed: " + e.message + " — is the server on http://127.0.0.1:8765?"); })
    .then(function () { b.disabled = false; });
}
function refresh(quiet) {
  return Promise.all([loadModels(), loadBoard(), loadRuns(), loadDetail()]).then(function () {
    showErr(null); setHealth(true, "api ok");
  }).catch(function (e) {
    if (!quiet || $("error").hidden) showErr("API unreachable: " + e.message + " — start server, then open http://127.0.0.1:8765/");
    setHealth(false, "api down");
  });
}
$("queue").addEventListener("click", queueRun);
/* nav: ensure one "Prompt bank" link to prompts.html (manual benchmarking). */
(function () {
  if (document.querySelector('a[href="prompts.html"]')) return;
  var h = document.querySelector("header.top"), a = document.createElement("a");
  a.href = "prompts.html"; a.textContent = "Prompt bank →";
  a.style.cssText = "color:var(--acc);font-size:13px;font-weight:600;text-decoration:none;white-space:nowrap";
  if (h) h.insertBefore(a, h.children[1] || null); else document.body.insertBefore(a, document.body.firstChild);
})();
refresh(false);
state.timer = setInterval(function () { refresh(true); }, 5000);
