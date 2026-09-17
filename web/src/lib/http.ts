import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * API response helpers — Owner: SUB-AGENT 8/10 BACKEND+DATA.
 *
 * Caching policy (demo dataset refreshes are infrequent and versioned):
 * - Collection/detail/trend payloads are immutable per methodology version,
 *   so they are CDN-cacheable with stale-while-revalidate.
 * - Validation failures -> 400 with flattened Zod issues (no stack traces).
 * - Unknown slugs -> 404 `{ error }`. All bodies are JSON.
 */

/** CDN cache profiles (seconds). */
export const CACHE_PROFILES = {
  /** Collections + details: dataset changes only with a new seed/methodology. */
  dataset: { sMaxAge: 3600, swr: 86400 },
  /** Compare/trends aggregations: same immutability, shorter edge TTL. */
  aggregate: { sMaxAge: 1800, swr: 86400 },
} as const;

export function cacheControlHeader(sMaxAge: number, swr: number): string {
  return `public, s-maxage=${sMaxAge}, stale-while-revalidate=${swr}`;
}

/** JSON success with CDN caching headers. */
export function jsonOk<T>(
  data: T,
  profile: keyof typeof CACHE_PROFILES = "dataset",
  init?: { status?: number },
): NextResponse {
  const { sMaxAge, swr } = CACHE_PROFILES[profile];
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: { "Cache-Control": cacheControlHeader(sMaxAge, swr) },
  });
}

/** JSON error (never cacheable — Surrogate/no-store). */
export function jsonError(
  error: string,
  status = 400,
  details?: unknown,
): NextResponse {
  const body: Record<string, unknown> = { error };
  if (details !== undefined) body.details = details;
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Shared slug param (kebab-case, e.g. `demo-helios-ultra`). */
export const SlugSchema = z
  .string()
  .min(1, "slug required")
  .max(80, "slug too long")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug must be lowercase alphanumeric with single hyphens");

export type Slug = z.infer<typeof SlugSchema>;

export type QueryParse<T> =
  | { ok: true; data: T }
  | { ok: false; issues: z.ZodIssue[] };

/**
 * Validate `request.url` search params against a Zod schema.
 * Coerces single-value params; comma-joins stay the caller's job.
 */
export function parseQuery<T extends z.ZodTypeAny>(
  schema: T,
  url: string,
): QueryParse<z.infer<T>> {
  const u = new URL(url);
  const raw: Record<string, string | string[]> = {};
  for (const key of u.searchParams.keys()) {
    const all = u.searchParams.getAll(key);
    raw[key] = all.length > 1 ? all : (all[0] ?? "");
  }
  const parsed = schema.safeParse(raw);
  if (parsed.success) return { ok: true, data: parsed.data };
  return { ok: false, issues: parsed.error.issues };
}

/** Split a comma-separated query value into a deduped slug list. */
export function splitSlugs(value: unknown, max: number): string[] {
  const list = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const s = raw.trim().toLowerCase();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= max) break;
  }
  return out;
}
