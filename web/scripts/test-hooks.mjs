/**
 * ESM resolve hooks for smoke tests — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 * Maps `@/…` to web/src/…, extensionless TS to .ts, and `zod` /
 * `next/server` to web/scripts/test-shims.mjs. Test-only.
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const SCRIPTS = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(SCRIPTS, "..", "src");
const SHIMS = pathToFileURL(path.join(SCRIPTS, "test-shims.mjs")).href;

function tryFile(candidates) {
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return pathToFileURL(c).href;
    } catch {
      /* next */
    }
  }
  return null;
}

export async function resolve(specifier, context, next) {
  if (specifier === "zod" || specifier === "next/server") {
    return { url: SHIMS, shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const base = path.join(SRC, specifier.slice(2));
    const hit = tryFile([base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")]);
    if (hit) return { url: hit, shortCircuit: true };
  }
  try {
    return await next(specifier, context);
  } catch (err) {
    const bare = !specifier.endsWith(".ts") && !specifier.endsWith(".tsx") && !specifier.endsWith(".mjs");
    if (bare && (specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
      const base = path.resolve(path.dirname(fileURLToPath(context.parentURL)), specifier);
      const hit = tryFile([`${base}.ts`, `${base}.tsx`]);
      if (hit) return { url: hit, shortCircuit: true };
    }
    throw err;
  }
}
