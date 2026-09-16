'use strict';
/* BDX Bench model-output -> workspace applier — zero npm dependencies.
 * Extracts ``` fenced code blocks from model text and writes them over the
 * setupFiles (by relative path) inside the temp workdir, before checks run. */

const fs = require('node:fs');
const path = require('node:path');

// Returns [{info, code}] in document order. Info string is the text after the
// opening fence on the same line (often a language tag or a file path).
function extractCodeBlocks(text) {
  const blocks = [];
  const re = /```([^\n`]*)\n([\s\S]*?)```/g;
  let m;
  while ((m = re.exec(String(text || ''))) !== null) {
    blocks.push({ info: (m[1] || '').trim(), code: m[2] || '' });
  }
  return blocks;
}

function normRel(p) {
  return String(p || '').replace(/^[/\\]+/, '').replace(/\\/g, '/');
}

// Match a candidate filename against the sorted setup-file list.
// Matches on exact relative path, or on basename / suffix equality.
function matchFile(files, name) {
  const want = normRel(name).toLowerCase();
  if (!want) return null;
  const exact = files.find((f) => normRel(f).toLowerCase() === want);
  if (exact) return exact;
  const base = want.split('/').pop();
  const cands = files.filter((f) => {
    const n = normRel(f).toLowerCase();
    return n === base || n.split('/').pop() === base || n.endsWith(`/${want}`) || n.endsWith(`/${base}`);
  });
  return cands.length === 1 ? cands[0] : null;
}

// A block is "targeted" when the info string looks like a path (has . or /),
// or when its first code line is a FILE marker, e.g. `# FILE: app.py`.
function targetedFile(block, files) {
  if (/[./\\]/.test(block.info)) {
    const hit = matchFile(files, block.info);
    if (hit) return { file: hit, code: block.code };
  }
  const first = String(block.code).split(/\r?\n/)[0] || '';
  const m = first.match(/^\s*(?:\/\/|#|--|<!--)?\s*file\s*:\s*(\S+?)\s*(?:-->)?\s*$/i);
  if (m) {
    const hit = matchFile(files, m[1]);
    if (hit) {
      const rest = String(block.code).split(/\r?\n/).slice(1).join('\n');
      return { file: hit, code: rest };
    }
  }
  return null;
}

function writeWorkdirFile(workdir, rel, code) {
  const full = path.join(workdir, normRel(rel));
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, String(code), 'utf8');
  return Buffer.byteLength(String(code), 'utf8');
}

// True when rel is a safe workdir-relative path (no absolute, no ".." escape).
function isSafeRel(rel) {
  const n = normRel(rel);
  if (!n || n.length === 0) return false;
  if (/^[a-zA-Z]:/.test(n) || n.startsWith('/') || n.startsWith('\\\\')) return false;
  return !n.split('/').some((seg) => seg === '..' || seg === '');
}

// Writes model blocks over setupFiles. An EXPLICITLY targeted block (file
// path in the info string, or a first-line "FILE: <path>" marker) is written
// to that path, creating it when missing — terminal-style tasks expect the
// model to create answer files from scratch. Untargeted blocks can only ever
// overwrite setupFiles (never create), and only under an unambiguous mapping
// (1 block <-> 1 file, or N blocks <-> N files in order); anything else is
// ignored with a note so stray prose fences cannot clobber the workspace.
// Resolve a block to an explicit target path: first against known setup
// files (exact/basename/suffix match), else the literal info string when it
// looks like a path, else a first-line "FILE: <path>" marker. Returns null
// when the block names no file.
function resolveTargeted(block, files) {
  const direct = targetedFile(block, files);
  if (direct) return direct;
  if (/[./\\]/.test(block.info)) {
    return { file: normRel(block.info), code: block.code };
  }
  const first = String(block.code).split(/\r?\n/)[0] || '';
  const m = first.match(/^\s*(?:\/\/|#|--|<!--)?\s*file\s*:\s*(\S+?)\s*(?:-->)?\s*$/i);
  if (m) {
    return { file: normRel(m[1]), code: String(block.code).split(/\r?\n/).slice(1).join('\n') };
  }
  return null;
}

// Returns {applied: [{path, bytes, created}], notes: [str]}.
function applyModelOutput(workdir, files, modelText) {
  const sorted = [...new Set(files.map(String))].sort();
  const applied = [];
  const notes = [];
  const blocks = extractCodeBlocks(modelText);
  if (blocks.length === 0) {
    notes.push(sorted.length === 0
      ? 'no setup files and no fenced code blocks in model output; nothing to do'
      : 'no fenced code blocks in model output; setup files unchanged');
    return { applied, notes };
  }
  const used = new Set();
  const rest = [];
  for (const b of blocks) {
    const hit = resolveTargeted(b, sorted);
    if (hit) {
      if (!isSafeRel(hit.file)) {
        notes.push(`unsafe targeted path ignored: ${JSON.stringify(hit.file).slice(0, 100)}`);
        continue;
      }
      if (used.has(hit.file)) {
        rest.push(b);
        continue;
      }
      used.add(hit.file);
      const existed = sorted.includes(hit.file);
      const bytes = writeWorkdirFile(workdir, hit.file, hit.code);
      applied.push({ path: hit.file, bytes, created: !existed });
    } else {
      rest.push(b);
    }
  }
  const free = sorted.filter((f) => !used.has(f));
  if (rest.length > 0 && free.length > 0) {
    if (rest.length === 1 && free.length === 1) {
      const bytes = writeWorkdirFile(workdir, free[0], rest[0].code);
      applied.push({ path: free[0], bytes, created: false });
      notes.push(`untargeted block written to sole setup file ${free[0]}`);
    } else if (rest.length === free.length) {
      rest.forEach((b, i) => {
        const bytes = writeWorkdirFile(workdir, free[i], b.code);
        applied.push({ path: free[i], bytes, created: false });
      });
      notes.push(`mapped ${rest.length} untargeted blocks to setup files in order`);
    } else {
      notes.push(`${rest.length} untargeted block(s) ignored (ambiguous mapping onto ${free.length} setup file(s))`);
    }
  } else if (rest.length > 0) {
    notes.push(`${rest.length} untargeted block(s) ignored (all setup files already targeted)`);
  }
  if (applied.length === 0) notes.push('no blocks applied; setup files unchanged');
  return { applied, notes };
}

module.exports = { extractCodeBlocks, applyModelOutput };
