'use strict';
/* BDX Bench check runner — zero npm dependencies (node built-ins only).
 *
 * Supported check types (aliases accepted, case-insensitive, -/_ interchangeable):
 *   file-exists  (exists)              {path}                       — path exists in workdir
 *   file-contains (contains|grep)      {path, contains|substring|text|pattern[, regex]}
 *   shell        (run|cmd|exec|command){command|cmd|run[, expectExit|exitCode, timeoutMs|timeout, contains]}
 *
 * WINDOWS-SANDBOX CONSTRAINT: never capture child output via piped stdio
 * (fails with EPERM). Shell checks run via child_process.spawnSync with
 * stdio:'ignore', redirecting output to a temp log file INSIDE the shell
 * command (`> log 2>&1`), which is then read back from disk. */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');

const DEFAULT_SHELL_TIMEOUT_MS = 60000;
const LOG_TAIL_MAX = 2000;

function normType(t) {
  return String(t || '').trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function normRel(p) {
  return String(p || '').replace(/^[/\\]+/, '');
}

function runFileExists(workdir, check) {
  const rel = normRel(check.path);
  if (!rel) return { pass: false, detail: 'file-exists: missing "path"' };
  const full = path.join(workdir, rel);
  const ok = fs.existsSync(full);
  return { pass: ok, detail: `file-exists ${rel}: ${ok ? 'found' : 'MISSING'}` };
}

function runFileContains(workdir, check) {
  const rel = normRel(check.path);
  const needle = check.contains ?? check.substring ?? check.text ?? check.expect ?? check.pattern;
  if (!rel) return { pass: false, detail: 'file-contains: missing "path"' };
  if (needle === undefined) return { pass: false, detail: `file-contains ${rel}: missing "contains"` };
  const full = path.join(workdir, rel);
  let content;
  try {
    content = fs.readFileSync(full, 'utf8');
  } catch {
    return { pass: false, detail: `file-contains ${rel}: file unreadable or missing` };
  }
  let ok;
  if (check.regex) {
    try {
      ok = new RegExp(String(needle)).test(content);
    } catch (err) {
      return { pass: false, detail: `file-contains ${rel}: bad regex (${err.message})` };
    }
  } else {
    ok = content.includes(String(needle));
  }
  return { pass: ok, detail: `file-contains ${rel} ${check.regex ? 'regex' : 'substring'} ${JSON.stringify(String(needle)).slice(0, 80)}: ${ok ? 'MATCH' : 'NO MATCH'}` };
}

function runShell(workdir, check) {
  const command = check.command ?? check.cmd ?? check.run ?? '';
  if (!command || typeof command !== 'string') {
    return { pass: false, detail: 'shell: missing "command"' };
  }
  const expectExit = check.expectExit ?? check.exitCode ?? 0;
  const timeout = check.timeoutMs ?? check.timeout ?? DEFAULT_SHELL_TIMEOUT_MS;
  const wantInLog = check.contains ?? check.substring ?? null;

  // Temp log file OUTSIDE the workdir so it can never satisfy file-* checks.
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bdx-shell-'));
  const logFile = path.join(tmpDir, 'shell.log');

  // Redirect inside the shell; child stdio stays 'ignore' (no pipe capture).
  const isWin = process.platform === 'win32';
  const exe = isWin ? 'cmd.exe' : '/bin/sh';
  const args = isWin
    ? ['/d', '/s', '/c', `${command} > "${logFile}" 2>&1`]
    : ['-c', `${command} > "${logFile}" 2>&1`];

  let status = null;
  let spawnErr = '';
  try {
    const r = cp.spawnSync(exe, args, {
      cwd: workdir,
      stdio: 'ignore', // REQUIRED: piped stdio fails with EPERM in the sandbox.
      timeout,
      windowsHide: true,
    });
    status = r.status;
    if (r.error) spawnErr = String((r.error && r.error.message) || r.error);
  } catch (err) {
    spawnErr = String((err && err.message) || err);
  }

  let output = '';
  try {
    output = fs.readFileSync(logFile, 'utf8');
  } catch {
    output = '';
  }
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch { /* best effort */ }

  const exitOk = status === expectExit;
  const logOk = wantInLog === null || output.includes(String(wantInLog));
  const pass = exitOk && logOk && spawnErr === '';
  const short = command.length > 120 ? `${command.slice(0, 120)}...` : command;
  let detail = `shell \`${short}\`: exit=${status === null ? 'null(timeout/signal)' : status} (want ${expectExit})`;
  if (spawnErr) detail += ` spawnErr=${spawnErr.slice(0, 200)}`;
  if (wantInLog !== null) detail += ` log-contains=${logOk ? 'MATCH' : 'NO MATCH'}`;
  const tail = output.trim().split(/\r?\n/).slice(-5).join(' | ').slice(0, 500);
  if (tail) detail += ` logTail=[${tail}]`;
  return { pass, detail };
}

function runOneCheck(workdir, check, index) {
  const t = normType(check.type ?? check.check ?? check.kind ?? '');
  let r;
  if (t === 'file-exists' || t === 'exists') r = runFileExists(workdir, check);
  else if (t === 'file-contains' || t === 'contains' || t === 'grep') r = runFileContains(workdir, check);
  else if (t === 'shell' || t === 'run' || t === 'cmd' || t === 'exec' || t === 'command') r = runShell(workdir, check);
  else r = { pass: false, detail: `check[${index}]: unknown type ${JSON.stringify(check.type ?? check.check ?? null)}` };
  return { index, type: t || 'unknown', pass: r.pass, detail: r.detail };
}

// Runs all checks; never throws (each check is already guarded, belt-and-braces here).
// opts.defaultTimeoutMs overrides the shell default (e.g. from task.timeoutSec).
function runChecks(workdir, checks, opts = {}) {
  const list = Array.isArray(checks) ? checks : [];
  const details = list.map((c, i) => {
    try {
      const check = c && typeof c === 'object' ? { ...c } : {};
      if ((check.timeoutMs ?? check.timeout) === undefined && opts.defaultTimeoutMs) {
        check.timeoutMs = opts.defaultTimeoutMs;
      }
      return runOneCheck(workdir, check, i);
    } catch (err) {
      return { index: i, type: 'unknown', pass: false, detail: `check[${i}]: harness error ${String((err && err.message) || err)}` };
    }
  });
  const passed = details.filter((d) => d.pass).length;
  const total = details.length;
  const passAll = total > 0 && passed === total;
  const lines = details.map((d) => `[${d.pass ? 'PASS' : 'FAIL'}] ${d.detail}`);
  let log = lines.join('\n');
  if (log.length > LOG_TAIL_MAX) log = `...[truncated ${log.length - LOG_TAIL_MAX} chars]\n` + log.slice(-LOG_TAIL_MAX);
  return { total, passed, passAll, details, log };
}

module.exports = { runChecks };
