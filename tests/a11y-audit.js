'use strict';
// BDX Bench accessibility + perf static audit — zero deps (node builtins only).
// Usage: node tests/a11y-audit.js [--dir public]
// Exit: 0 = no FAIL findings (WARNs ok), 1 = FAIL findings, 2 = blocked (no HTML to audit).
//
// Scans served HTML/CSS for: landmarks, skip link, focus rings, names/labels,
// chart text alternatives, dialog semantics, table headers, reduced-motion,
// viewport/charset meta, brand contrast pairs, light-mode mechanism.
// Also greps server/server.js static path for perf headers (advisory WARNs for server agent).
// This is static analysis, NOT a substitute for keyboard walkthrough + Lighthouse
// (see web/QA_CHECKLIST.md for the manual pass).

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const dirFlag = process.argv.indexOf('--dir');
const PUBLIC_DIR = dirFlag !== -1 && process.argv[dirFlag + 1]
  ? path.resolve(process.argv[dirFlag + 1])
  : path.join(ROOT, 'public');
const SERVER_FILE = path.join(ROOT, 'server', 'server.js');

const fails = [];
const warns = [];
const passes = [];
function FAIL(msg) { fails.push(msg); console.log(`FAIL: ${msg}`); }
function WARN(msg) { warns.push(msg); console.log(`WARN: ${msg}`); }
function PASS(msg) { passes.push(msg); console.log(`PASS: ${msg}`); }

// --- contrast helpers (WCAG 2.x relative luminance) ---
function hexRgb(hex) {
  const m = hex.replace('#', '');
  const v = m.length === 3 ? m.split('').map((c) => c + c).join('') : m;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16) / 255);
}
function lum(hex) {
  const f = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const [r, g, b] = hexRgb(hex).map(f);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

function checkContrast(fg, bg, label, min = 4.5) {
  const r = ratio(fg, bg);
  if (r >= min) PASS(`${label}: ${fg} on ${bg} ratio ${r.toFixed(2)} (>= ${min})`);
  else FAIL(`${label}: ${fg} on ${bg} ratio ${r.toFixed(2)} (< ${min})`);
}

function auditHtml(file, html) {
  const tag = path.basename(file);
  const has = (re) => re.test(html);

  if (/^\s*<!doctype html>/i.test(html)) PASS(`${tag}: doctype present`);
  else FAIL(`${tag}: missing <!doctype html>`);

  if (/<html[^>]*\slang\s*=\s*["'][a-z-]+["']/i.test(html)) PASS(`${tag}: <html lang> present`);
  else FAIL(`${tag}: <html> missing lang attribute`);

  if (/<title>[^<]+<\/title>/i.test(html)) PASS(`${tag}: non-empty <title>`);
  else FAIL(`${tag}: missing/empty <title>`);

  if (/<meta[^>]*charset/i.test(html)) PASS(`${tag}: charset meta`);
  else FAIL(`${tag}: missing charset meta`);

  if (/<meta[^>]*name=["']viewport["']/i.test(html)) PASS(`${tag}: viewport meta (responsive)`);
  else FAIL(`${tag}: missing viewport meta`);

  const mains = (html.match(/<main[\s>]/gi) || []).length + (html.match(/role=["']main["']/gi) || []).length;
  if (mains >= 1) PASS(`${tag}: main landmark present`);
  else FAIL(`${tag}: no <main> landmark (screen-reader navigation)`);

  for (const el of ['header', 'nav', 'footer']) {
    if (has(new RegExp(`<${el}[\\s>]`, 'i'))) PASS(`${tag}: <${el}> landmark`);
    else WARN(`${tag}: no <${el}> landmark`);
  }

  // Skip link: first-link a[href="#..."] mentioning skip, before <main>.
  const bodyTop = html.slice(0, Math.max(0, html.search(/<main[\s>]/i)));
  if (/<a[^>]*href=["']#[^"']+["'][^>]*>[^<]*skip[^<]*<\/a\s*>/i.test(bodyTop || html)) {
    PASS(`${tag}: skip link present`);
  } else FAIL(`${tag}: missing skip link (keyboard users must tab through nav)`);

  // Images need alt.
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const imgsNoAlt = imgs.filter((t) => !/\salt\s*=/i.test(t));
  if (imgs.length === 0) PASS(`${tag}: no <img> (nothing to alt)`);
  else if (imgsNoAlt.length === 0) PASS(`${tag}: all ${imgs.length} <img> have alt`);
  else FAIL(`${tag}: ${imgsNoAlt.length}/${imgs.length} <img> missing alt`);

  // Buttons need accessible names.
  const btns = html.match(/<button\b[^>]*>[\s\S]*?<\/button\s*>/gi) || [];
  const btnBad = btns.filter((t) => !/aria-label\s*=/i.test(t) && !/<button\b[^>]*>(?!\s*<\/button)/i.test(t.replace(/<button\b[^>]*>\s*<\/button\s*>/i, '')));
  const emptyBtns = btns.filter((t) => /<button\b[^>]*>\s*<\/button\s*>/i.test(t) && !/aria-label\s*=/i.test(t));
  if (btns.length === 0) PASS(`${tag}: no <button> elements`);
  else if (emptyBtns.length === 0) PASS(`${tag}: all ${btns.length} <button> have text or aria-label`);
  else FAIL(`${tag}: ${emptyBtns.length}/${btns.length} empty <button> without aria-label`);
  void btnBad;

  // Inputs need labels.
  const inputs = html.match(/<(input|select|textarea)\b[^>]*>/gi) || [];
  let labelled = 0;
  for (const inp of inputs) {
    if (/aria-label\s*=|aria-labelledby\s*=/i.test(inp)) { labelled++; continue; }
    const idm = inp.match(/\sid\s*=\s*["']([^"']+)["']/i);
    if (idm && new RegExp(`<label[^>]*for=["']${idm[1]}["']`, 'i').test(html)) { labelled++; continue; }
    if (/<label\b[^>]*>(?![\s\S]*<\/label>)[\s\S]*$/.test(html)) { labelled++; } // wrapped (approx)
  }
  if (inputs.length === 0) PASS(`${tag}: no form controls`);
  else if (labelled === inputs.length) PASS(`${tag}: all ${inputs.length} form controls labelled`);
  else FAIL(`${tag}: ${inputs.length - labelled}/${inputs.length} form controls without label/aria-label`);

  // Positive tabindex (keyboard trap smell).
  const postab = html.match(/tabindex=["']([1-9][0-9]*)["']/gi) || [];
  if (postab.length === 0) PASS(`${tag}: no positive tabindex`);
  else FAIL(`${tag}: ${postab.length} positive tabindex (breaks tab order)`);

  // Tables: th scope.
  const tables = html.match(/<table\b[\s\S]*?<\/table\s*>/gi) || [];
  if (tables.length === 0) PASS(`${tag}: no <table>`);
  else {
    const bad = tables.filter((t) => !/<th\b/i.test(t));
    if (bad.length === 0) PASS(`${tag}: all ${tables.length} tables have <th>`);
    else FAIL(`${tag}: ${bad.length}/${tables.length} tables without <th> headers`);
    const noScope = tables.filter((t) => /<th\b/i.test(t) && !/scope\s*=/i.test(t));
    if (noScope.length > 0) WARN(`${tag}: ${noScope.length} tables use <th> without scope=`);
  }

  // Dialogs/trays: role=dialog needs aria-modal + accessible name.
  const dialogs = html.match(/role=["']dialog["']/gi) || [];
  if (dialogs.length === 0) PASS(`${tag}: no custom dialogs (nothing to trap-focus)`);
  else {
    const named = (html.match(/role=["']dialog["'][\s\S]{0,400}?aria-label\s*=/gi) || []).length;
    if (named >= dialogs.length) PASS(`${tag}: all dialogs named`);
    else FAIL(`${tag}: dialog(s) missing accessible name (aria-label/labelledby)`);
    if (/aria-modal\s*=\s*["']true["']/i.test(html)) PASS(`${tag}: dialog aria-modal present`);
    else WARN(`${tag}: dialog without aria-modal="true" (verify focus trap in manual pass)`);
  }

  // Charts: canvas/svg data-viz need text alternative (role=img+label or adjacent table/details).
  const charts = (html.match(/<canvas\b/gi) || []).length + (html.match(/data-chart|class=["'][^"']*chart/gi) || []).length;
  if (charts === 0) PASS(`${tag}: no canvas/chart widgets`);
  else {
    const altOk = /role=["']img["'][\s\S]{0,300}?aria-label|aria-label[\s\S]{0,300}?role=["']img["']/i.test(html) ||
      /<details\b/i.test(html) || /<table\b[\s\S]*?data-chart-desc/i.test(html);
    if (altOk) PASS(`${tag}: chart text alternative present`);
    else FAIL(`${tag}: ${charts} chart/canvas widget(s) without text alternative (role=img+aria-label or data table)`);
  }
}

function auditCss(file, css) {
  const tag = path.basename(file);
  if (/:focus-visible|:focus\b/.test(css) && /outline|box-shadow|border/.test(css)) {
    PASS(`${tag}: visible focus-ring styles (:focus-visible/:focus)`);
  } else FAIL(`${tag}: no visible focus-ring styles — keyboard users cannot see focus`);

  if (/@media[^{]*prefers-reduced-motion/i.test(css)) PASS(`${tag}: prefers-reduced-motion handled`);
  else FAIL(`${tag}: no prefers-reduced-motion media query (vestibular safety)`);

  const hasDark = /#080A0D/i.test(css);
  const hasAccent = /#B8FF5A/i.test(css);
  if (hasDark && hasAccent) PASS(`${tag}: brand tokens present (#080A0D / #B8FF5A)`);
  else WARN(`${tag}: brand tokens missing (dark=#080A0D accent=#B8FF5A) — verify theme source`);

  if (/prefers-color-scheme|data-theme|\.light-theme|\.theme-light/i.test(css)) {
    PASS(`${tag}: light-mode mechanism present`);
  } else FAIL(`${tag}: no light-mode mechanism (prefers-color-scheme or theme toggle)`);
}

function main() {
  let htmlFiles = [];
  try {
    htmlFiles = fs.readdirSync(PUBLIC_DIR).filter((f) => f.endsWith('.html'))
      .map((f) => path.join(PUBLIC_DIR, f));
  } catch (_) { htmlFiles = []; }
  // Include one-level subdirs (arena pages etc.).
  try {
    for (const d of fs.readdirSync(PUBLIC_DIR, { withFileTypes: true }).filter((e) => e.isDirectory())) {
      const sub = path.join(PUBLIC_DIR, d.name);
      try {
        for (const f of fs.readdirSync(sub).filter((x) => x.endsWith('.html'))) htmlFiles.push(path.join(sub, f));
      } catch (_) {}
    }
  } catch (_) {}

  if (htmlFiles.length === 0) {
    console.log(`BLOCKED: no HTML files in ${PUBLIC_DIR} — public/ UI absent (UI agent owns restore).`);
    console.log('A11y component pass cannot run until index.html lands. See web/QA_CHECKLIST.md.');
    process.exit(2);
  }

  for (const f of htmlFiles) {
    auditHtml(f, fs.readFileSync(f, 'utf8'));
  }

  let cssFiles = [];
  const collectCss = (dir) => {
    let out = [];
    try {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isFile() && e.name.endsWith('.css')) out.push(full);
        else if (e.isDirectory()) out = out.concat(collectCss(full));
      }
    } catch (_) {}
    return out;
  };
  cssFiles = collectCss(PUBLIC_DIR);
  if (cssFiles.length === 0) WARN('no CSS files found — focus/reduced-motion checks skipped');
  for (const f of cssFiles) auditCss(f, fs.readFileSync(f, 'utf8'));

  // Brand contrast pairs (absolute — independent of UI files).
  console.log('--- brand contrast (WCAG AA text >= 4.5) ---');
  checkContrast('#B8FF5A', '#080A0D', 'accent-on-dark');
  checkContrast('#080A0D', '#B8FF5A', 'dark-on-accent');
  checkContrast('#080A0D', '#FFFFFF', 'dark-on-white (light mode body)');
  checkContrast('#FFFFFF', '#080A0D', 'white-on-dark (dark mode body)');

  // Server static perf headers (advisory for server agent — WARN only, never FAIL).
  console.log('--- server static perf (advisory, owner: server agent) ---');
  try {
    const srv = fs.readFileSync(SERVER_FILE, 'utf8');
    const staticSection = srv.slice(srv.indexOf('function serveStatic'));
    if (/Cache-Control/i.test(staticSection)) PASS('server: serveStatic sets Cache-Control');
    else WARN('server: serveStatic sets no Cache-Control (static .js/.css re-fetched every load)');
    if (/ETag|Last-Modified|Content-Length/i.test(staticSection)) PASS('server: serveStatic sets validators/length');
    else WARN('server: serveStatic sets no ETag/Last-Modified/Content-Length on static files');
    if (/Content-Security-Policy|X-Content-Type-Options/i.test(srv)) PASS('server: security headers present');
    else WARN('server: no CSP / X-Content-Type-Options headers (hardening backlog)');
  } catch (_) {
    WARN('server: could not read server/server.js for header audit');
  }

  console.log(`--- summary: ${passes.length} pass, ${warns.length} warn, ${fails.length} fail ---`);
  process.exit(fails.length > 0 ? 1 : 0);
}

main();
