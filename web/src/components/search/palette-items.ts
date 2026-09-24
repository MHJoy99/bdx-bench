import type { Benchmark, Provider } from "@/lib/types";

/**
 * Command-palette index + ranking + recents.
 * Pure logic (no React) so hosts can unit-test ranking without rendering.
 *
 * Owner: SUB-AGENT 10/10 POLISH. Additive — does not touch routes or lib/.
 */

/** Palette entry kinds, in display order. */
export type PaletteKind = "model" | "benchmark" | "provider" | "family" | "page";

export interface PaletteItem {
  /** Stable id, e.g. "model:gpt-5-luna". Persisted in recents. */
  id: string;
  kind: PaletteKind;
  title: string;
  hint?: string;
  keywords?: string;
  href: string;
}

/**
 * Minimal structural inputs — full `Model` / `Benchmark` objects from
 * `@/lib/types` satisfy these, hosts may also pass hand-built rows.
 */
export interface PaletteModelInput {
  slug: string;
  name: string;
  family: string;
  provider: string;
}

export interface PaletteBenchmarkInput {
  slug: string;
  name: string;
  category: string;
}

export const PALETTE_GROUP_ORDER: PaletteKind[] = [
  "model",
  "benchmark",
  "provider",
  "family",
  "page",
];

export const PALETTE_GROUP_LABEL: Record<PaletteKind, string> = {
  model: "Models",
  benchmark: "Benchmarks",
  provider: "Providers",
  family: "Families",
  page: "Pages",
};

const PROVIDER_LABELS: { id: Provider; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "anthropic", label: "Anthropic" },
  { id: "google", label: "Google" },
  { id: "meta", label: "Meta" },
  { id: "mistral", label: "Mistral" },
  { id: "deepseek", label: "DeepSeek" },
  { id: "qwen", label: "Qwen" },
  { id: "xai", label: "xAI" },
  { id: "other", label: "Other" },
];

export interface PalettePageDef {
  title: string;
  hint: string;
  keywords?: string;
  href: string;
}

/** Static page index — mirrors web/README.md route table. */
export const CANONICAL_MODELS: PaletteModelInput[] = [
  { slug: "muse-spark-1-3", name: "Muse Spark 1.3", family: "Muse Spark", provider: "other" },
  { slug: "deepseek-v4-1-flash", name: "DeepSeek V4.1 Flash", family: "DeepSeek", provider: "deepseek" },
  { slug: "space-bunny-free", name: "Space Bunny Free", family: "OpenCode", provider: "other" },
  { slug: "gpt-6-sol", name: "GPT 6 Sol", family: "GPT Sol", provider: "openai" },
  { slug: "gemini-pro-agent", name: "Gemini Pro Agent", family: "Gemini Pro", provider: "google" },
  { slug: "gpt-6-luna", name: "GPT Luna 6", family: "GPT Luna", provider: "openai" },
  { slug: "gpt-5-6-luna", name: "GPT Luna 5.6", family: "GPT Luna", provider: "openai" },
  { slug: "gemini-3-8-flash", name: "Gemini 3.8 Flash", family: "Gemini Flash", provider: "google" },
];

export const CANONICAL_BENCHMARKS: PaletteBenchmarkInput[] = [
  { slug: "zombie-flamethrower-showdown", name: "Zombie Flamethrower Showdown", category: "agentic" },
];

export const CANONICAL_PAGES: PalettePageDef[] = [
  { title: "Home", hint: "Overview", keywords: "home dashboard start", href: "/" },
  {
    title: "Leaderboard",
    hint: "Rankings by BDX Bench Score",
    keywords: "rankings ranks scores top best",
    href: "/leaderboard",
  },
  {
    title: "Live Eval",
    hint: "Realtime evaluation telemetry & double-blind benchmark",
    keywords: "live eval telemetry real-time progress benchmark blind runner test",
    href: "/eval",
  },
  {
    title: "Models",
    hint: "All models",
    keywords: "models list catalog",
    href: "/models",
  },
  {
    title: "Benchmarks",
    hint: "All benchmarks",
    keywords: "suites evals tests tasks",
    href: "/benchmarks",
  },
  {
    title: "Compare",
    hint: "Side-by-side model comparison",
    keywords: "versus vs difference diff",
    href: "/compare",
  },
  {
    title: "Price/Performance",
    hint: "Cost versus score",
    keywords: "price cost value cheap efficient",
    href: "/price-performance",
  },
  {
    title: "Trends",
    hint: "Score movement over time",
    keywords: "history chart progress over time",
    href: "/trends",
  },
  {
    title: "Methodology",
    hint: "How scores are computed",
    keywords: "scoring weights docs methodology version",
    href: "/methodology",
  },
  {
    title: "Compare: Muse Spark vs Gemini",
    hint: "Preselected comparison",
    keywords: "compare muse spark gemini versus",
    href: "/compare?models=muse-spark-1-3,gemini-3-8-flash",
  },
];

/** Static page index — mirrors web/README.md route table. */
export const DEFAULT_PAGES: PalettePageDef[] = CANONICAL_PAGES;

export interface PaletteIndexInput {
  models?: PaletteModelInput[];
  benchmarks?: PaletteBenchmarkInput[];
  /** Defaults to every Provider in `@/lib/types`. */
  providers?: Provider[];
  /** Defaults to families derived from `models` (sorted, unique). */
  families?: string[];
  /** Defaults to DEFAULT_PAGES. */
  pages?: PalettePageDef[];
}

/** Assemble the full searchable index. Pure — safe to memoize per data set. */
export function buildPaletteIndex(input: PaletteIndexInput): PaletteItem[] {
  const models = input.models ?? CANONICAL_MODELS;
  const benchmarks: PaletteBenchmarkInput[] = input.benchmarks ?? CANONICAL_BENCHMARKS;
  const providers = input.providers ?? PROVIDER_LABELS.map((p) => p.id);
  const families =
    input.families ??
    [...new Set(models.map((m) => m.family).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    );
  const pages = input.pages ?? DEFAULT_PAGES;

  const labelOf = (p: string): string =>
    PROVIDER_LABELS.find((x) => x.id === p)?.label ?? p;

  return [
    ...models.map((m) => ({
      id: `model:${m.slug}`,
      kind: "model" as const,
      title: m.name,
      hint: `${m.family} · ${labelOf(m.provider)}`,
      keywords: `${m.slug} ${m.family} ${m.provider}`,
      href: `/models/${m.slug}`,
    })),
    ...benchmarks.map((b: PaletteBenchmarkInput) => ({
      id: `benchmark:${b.slug}`,
      kind: "benchmark" as const,
      title: b.name,
      hint: b.category,
      keywords: `${b.slug} ${b.category}`,
      href: `/benchmarks/${b.slug}`,
    })),
    ...providers.map((p) => ({
      id: `provider:${p}`,
      kind: "provider" as const,
      title: labelOf(p),
      hint: "Provider",
      keywords: `provider ${p}`,
      href: `/leaderboard?provider=${encodeURIComponent(p)}`,
    })),
    ...families.map((f) => ({
      id: `family:${f}`,
      kind: "family" as const,
      title: f,
      hint: "Model family",
      keywords: `family series ${f}`,
      href: `/leaderboard?family=${encodeURIComponent(f)}`,
    })),
    ...pages.map((p) => ({
      id: `page:${p.href}`,
      kind: "page" as const,
      title: p.title,
      hint: p.hint,
      keywords: p.keywords,
      href: p.href,
    })),
  ];
}

/** Keep Benchmark import referenced for callers passing full objects. */
export type { Benchmark };

function normalize(s: string): string {
  return s.toLowerCase().trim().replace(/\s+/g, " ");
}

/**
 * Token-AND substring ranking. Every query token must match; title-prefix
 * beats title-substring beats hint/keyword/kind. Stable for equal scores.
 */
export function filterPalette(
  items: PaletteItem[],
  query: string,
  limit = 40,
): PaletteItem[] {
  const q = normalize(query);
  if (!q) return items.slice(0, limit);
  const tokens = q.split(" ").filter(Boolean);
  const scored: { item: PaletteItem; score: number; at: number }[] = [];
  items.forEach((item, at) => {
    const title = normalize(item.title);
    const rest = normalize(
      `${item.hint ?? ""} ${item.keywords ?? ""} ${item.kind}`,
    );
    let score = 0;
    for (const t of tokens) {
      if (title.startsWith(t)) score += 3;
      else if (title.includes(t)) score += 2;
      else if (rest.includes(t)) score += 1;
      else return;
    }
    scored.push({ item, score, at });
  });
  scored.sort((a, b) => b.score - a.score || a.at - b.at);
  return scored.slice(0, limit).map((s) => s.item);
}

// ---------------------------------------------------------------------------
// Recents (localStorage, SSR-safe)
// ---------------------------------------------------------------------------

const RECENT_KEY = "bdx-palette-recent-v1";
const RECENT_MAX = 8;

export function loadRecentIds(): string[] {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string").slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

/** Prepend id (dedupe, cap). Returns the updated list for state sync. */
export function saveRecentId(id: string): string[] {
  const next = [id, ...loadRecentIds().filter((x) => x !== id)].slice(0, RECENT_MAX);
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Private mode / quota — palette still works in-memory via return value.
  }
  return next;
}

/** Map stored ids back to live index entries (drops stale ids). */
export function resolveRecents(
  ids: string[],
  byId: Map<string, PaletteItem>,
  limit = 5,
): PaletteItem[] {
  const out: PaletteItem[] = [];
  for (const id of ids) {
    const item = byId.get(id);
    if (item) out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}
